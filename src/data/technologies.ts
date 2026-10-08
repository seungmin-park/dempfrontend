// Values are the persisted HTTP enum contract, including legacy "React".
export const technologyGroups = [
  { label: '언어', items: [
    ['JAVA','Java'], ['KOTLIN','Kotlin'], ['JAVASCRIPT','JavaScript'], ['TYPESCRIPT','TypeScript'], ['PYTHON','Python'], ['GO','Go'], ['C','C'], ['CPP','C++'], ['CSHARP','C#'], ['RUST','Rust'], ['SWIFT','Swift'], ['DART','Dart'], ['PHP','PHP'], ['RUBY','Ruby'], ['SQL','SQL'],
  ] },
  { label: '웹 UI', items: [['HTML','HTML'], ['CSS','CSS'], ['React','React'], ['VUE','Vue.js'], ['ANGULAR','Angular'], ['NEXT_JS','Next.js'], ['NUXT_JS','Nuxt.js']] },
  { label: '서버 프레임워크', items: [['SPRING','Spring'], ['SPRING_BOOT','Spring Boot'], ['JPA','JPA'], ['NODE_JS','Node.js'], ['NEST_JS','NestJS'], ['EXPRESS','Express'], ['DJANGO','Django'], ['FASTAPI','FastAPI'], ['DOTNET','.NET']] },
  { label: '모바일·게임', items: [['REACT_NATIVE','React Native'], ['FLUTTER','Flutter'], ['UNITY','Unity'], ['UNREAL_ENGINE','Unreal Engine']] },
  { label: '데이터 저장·메시징', items: [['MYSQL','MySQL'], ['MARIADB','MariaDB'], ['POSTGRESQL','PostgreSQL'], ['ORACLE','Oracle'], ['SQL_SERVER','SQL Server'], ['MONGODB','MongoDB'], ['REDIS','Redis'], ['ELASTICSEARCH','Elasticsearch'], ['KAFKA','Kafka'], ['RABBITMQ','RabbitMQ'], ['BIGQUERY','BigQuery']] },
  { label: '클라우드·운영', items: [['AWS','AWS'], ['GCP','Google Cloud'], ['AZURE','Azure'], ['LINUX','Linux'], ['DOCKER','Docker'], ['KUBERNETES','Kubernetes'], ['TERRAFORM','Terraform'], ['ANSIBLE','Ansible'], ['PROMETHEUS','Prometheus'], ['GRAFANA','Grafana']] },
  { label: '데이터·AI', items: [['PYTORCH','PyTorch'], ['TENSORFLOW','TensorFlow'], ['PANDAS','Pandas'], ['SPARK','Spark'], ['AIRFLOW','Airflow'], ['LANGCHAIN','LangChain'], ['LLM','LLM'], ['RAG','RAG']] },
  { label: '개발 도구', items: [['GIT','Git'], ['GITHUB_ACTIONS','GitHub Actions']] },
] as const;
export type Technology = typeof technologyGroups[number]['items'][number][0];
export const technologyValues: Technology[] = technologyGroups.flatMap(group => group.items.map(item => item[0]));
export const technologyLabels = Object.fromEntries(technologyGroups.flatMap<readonly [Technology, string]>(group => group.items)) as Record<Technology, string>;
export function matchingTechnologyGroups(term: string) {
  const query = term.trim().toLowerCase();
  return technologyGroups.map(group => ({ label: group.label, items: group.items.filter(([value, label]) => `${value} ${label}`.toLowerCase().includes(query)) })).filter(group => group.items.length);
}
