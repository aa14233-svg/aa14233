// 数据摄取（吸）
// AI AGENT ANNOTATION: 解析输入，提取实体/意图/约束

pub struct IngestPipeline;

impl IngestPipeline {
    pub fn process(input: &str) -> IngestResult {
        IngestResult { intent: "unknown".into(), entities: vec![], constraints: vec![] }
    }
}

pub struct IngestResult {
    pub intent: String,
    pub entities: Vec<String>,
    pub constraints: Vec<String>,
}
