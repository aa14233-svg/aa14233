// LSO-DAO 库入口
// AI AGENT ANNOTATION: 导出所有公共接口

pub mod kernel;
pub mod gate;
pub mod dispatch;
pub mod domains;
pub mod types;
pub mod api;
pub mod ingest;
pub mod security;
pub mod cluster;
pub mod evolve;
pub mod introspect;
pub mod acceptance;
pub mod fidelity;
pub mod fallback;
pub mod rag;

// 初始化函数
pub fn init() -> bool { true }
pub fn init_ego() -> bool { true }
pub fn init_trae_cluster() -> bool { true }
