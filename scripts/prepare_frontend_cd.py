"""Download only the artifact from the successful CI of the current main commit."""
import argparse
import hashlib
import io
import json
import os
from pathlib import Path
import re
import subprocess
import zipfile

REPOSITORY = 'seungmin-park/dempfrontend'
MAX_ARCHIVE = 32 * 1024 * 1024


def require_ci(run, jobs, artifacts, main_sha):
    expected = {'name': 'DEMP frontend CI', 'event': 'push', 'head_branch': 'main',
                'head_sha': main_sha, 'status': 'completed', 'conclusion': 'success'}
    if any(run.get(key) != value for key, value in expected.items()):
        raise ValueError('Only successful CI for the current main push can deploy')
    if not jobs or not any(job.get('name') == 'DEMP frontend verify' for job in jobs):
        raise ValueError('Required verification gate missing')
    if any(job.get('status') != 'completed' or job.get('conclusion') != 'success' for job in jobs):
        raise ValueError('Every CI job must succeed')
    name = f'deployment-dempfrontend-{run["id"]}-{run["run_attempt"]}'
    selected = [item for item in artifacts if item.get('name') == name]
    if len(selected) != 1:
        raise ValueError('Expected exactly one artifact for this CI attempt')
    artifact = selected[0]
    if (artifact.get('expired') is not False or not re.fullmatch(r'sha256:[a-f0-9]{64}', artifact.get('digest') or '')
            or not 0 < artifact.get('size_in_bytes', 0) <= MAX_ARCHIVE):
        raise ValueError('Artifact expired, oversized, or has no verified digest')
    return artifact


def require_payload(raw, digest, run):
    if len(raw) > MAX_ARCHIVE or 'sha256:' + hashlib.sha256(raw).hexdigest() != digest:
        raise ValueError('Artifact ZIP digest mismatch')
    with zipfile.ZipFile(io.BytesIO(raw)) as archive:
        manifests = [item for item in archive.infolist() if item.filename == 'component.json']
        if len(manifests) != 1 or manifests[0].file_size > 1024 * 1024:
            raise ValueError('Expected one bounded component manifest')
        record = json.loads(archive.read(manifests[0]))
    expected = dict(component='dempfrontend', repository=REPOSITORY, headSha=run['head_sha'],
                    sourceSha=run['head_sha'], runId=run['id'], runAttempt=run['run_attempt'])
    if not isinstance(record, dict) or any(record.get(k) != v for k, v in expected.items()):
        raise ValueError('Artifact component/source/run identity differs')
    # The VM independently validates every path, file digest and expanded limit.


def api(path):
    return json.loads(subprocess.check_output(['gh', 'api', path], text=True))


def pages(path, key):
    results = json.loads(subprocess.check_output(['gh', 'api', '--paginate', '--slurp', path], text=True))
    return [item for page in results for item in page[key]]


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--run-id', type=int, required=True)
    parser.add_argument('--output', type=Path, default=Path('.cd'))
    args = parser.parse_args()
    if args.run_id <= 0:
        parser.error('Invalid run ID')
    base = f'repos/{REPOSITORY}'
    run = api(f'{base}/actions/runs/{args.run_id}')
    jobs = pages(f'{base}/actions/runs/{args.run_id}/attempts/{run["run_attempt"]}/jobs?per_page=100', 'jobs')
    artifacts = pages(f'{base}/actions/runs/{args.run_id}/artifacts?per_page=100', 'artifacts')
    main_sha = api(base + '/git/ref/heads/main')['object']['sha']
    artifact = require_ci(run, jobs, artifacts, main_sha)
    args.output.mkdir(parents=True, exist_ok=True)
    destination = args.output / 'payload.zip'
    # gh follows the GitHub artifact redirect without logging its signed URL.
    with destination.open('wb') as stream:
        subprocess.run(['gh', 'api', f'{base}/actions/artifacts/{artifact["id"]}/zip'], stdout=stream, check=True)
    if destination.stat().st_size > MAX_ARCHIVE:
        raise ValueError('Artifact download exceeds limit')
    require_payload(destination.read_bytes(), artifact['digest'], run)
    metadata = dict(runId=run['id'], headSha=run['head_sha'], artifactId=artifact['id'],
                    archiveDigest=artifact['digest'][7:], runAttempt=run['run_attempt'])
    (args.output / 'metadata.json').write_text(json.dumps(metadata, indent=2) + '\n')
    if os.environ.get('GITHUB_ENV'):
        with open(os.environ['GITHUB_ENV'], 'a') as stream:
            for name, value in (('CD_RUN_ID', run['id']), ('CD_HEAD_SHA', run['head_sha']),
                                ('CD_ARCHIVE_DIGEST', artifact['digest'][7:])):
                stream.write(f'{name}={value}\n')
    print(f'Prepared verified frontend: CI {run["id"]}, attempt {run["run_attempt"]}, source {main_sha}')


if __name__ == '__main__':
    main()
