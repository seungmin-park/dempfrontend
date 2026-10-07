import importlib.util
from pathlib import Path
import unittest

HEAD = 'a' * 40


class CDPreparationTests(unittest.TestCase):
    def setUp(self):
        path = Path(__file__).parents[2] / 'scripts/prepare_frontend_cd.py'
        self.assertTrue(path.exists(), 'CD preparation is not implemented')
        spec = importlib.util.spec_from_file_location('cd', path)
        self.cd = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(self.cd)
        self.run = dict(id=100, name='DEMP frontend CI', event='push', head_branch='main',
                        head_sha=HEAD, status='completed', conclusion='success', run_attempt=2)
        self.jobs = [dict(name='DEMP frontend verify', status='completed', conclusion='success')]
        self.artifact = dict(id=200, name='deployment-dempfrontend-100-2',
                             expired=False, size_in_bytes=100, digest='sha256:' + 'b' * 64)

    def check(self, **changes):
        run = {**self.run, **changes}
        return self.cd.require_ci(run, self.jobs, [self.artifact], HEAD)

    def test_only_current_successful_main_push_with_exact_artifact(self):
        self.assertEqual(self.check(), self.artifact)

    def test_pr_dispatch_failed_cancelled_wrong_branch_and_stale_are_rejected(self):
        for changes in ({'event': 'pull_request'}, {'event': 'workflow_dispatch'},
                        {'head_branch': 'feature'}, {'conclusion': 'failure'},
                        {'status': 'in_progress'}, {'head_sha': 'c' * 40},
                        {'name': 'another workflow'}, {'run_attempt': 1}):
            with self.subTest(changes=changes), self.assertRaises(ValueError):
                self.check(**changes)

    def test_skipped_or_missing_verification_job_is_rejected(self):
        for jobs in ([], [{'name': 'another', 'status': 'completed', 'conclusion': 'success'}],
                     [{**self.jobs[0], 'conclusion': 'skipped'}]):
            with self.subTest(jobs=jobs), self.assertRaises(ValueError):
                self.cd.require_ci(self.run, jobs, [self.artifact], HEAD)

    def test_expired_missing_digest_and_duplicate_artifacts_are_rejected(self):
        for artifacts in ([{**self.artifact, 'expired': True}],
                          [{**self.artifact, 'digest': None}], [self.artifact, self.artifact], []):
            with self.subTest(artifacts=artifacts), self.assertRaises(ValueError):
                self.cd.require_ci(self.run, self.jobs, artifacts, HEAD)

    def test_zip_digest_and_component_identity_must_match(self):
        import hashlib
        import io
        import json
        import zipfile
        record = dict(component='dempfrontend', repository='seungmin-park/dempfrontend',
                      headSha=HEAD, sourceSha=HEAD, runId=100, runAttempt=2)
        def raw(data):
            stream = io.BytesIO()
            with zipfile.ZipFile(stream, 'w') as z:
                z.writestr('component.json', json.dumps(data))
            return stream.getvalue()
        data = raw(record)
        checksum = hashlib.sha256(data).hexdigest()
        self.cd.require_payload(data, 'sha256:' + checksum, self.run)
        with self.assertRaises(ValueError):
            self.cd.require_payload(data, 'sha256:' + '0' * 64, self.run)
        data = raw({**record, 'sourceSha': 'd' * 40})
        with self.assertRaises(ValueError):
            self.cd.require_payload(data, 'sha256:' + hashlib.sha256(data).hexdigest(), self.run)
