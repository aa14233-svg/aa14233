// ============================================================
// taibai_engine.rs — 太白玄学引擎 (Standalone, no external crates)
// 四柱八字 / 六爻 / 紫微斗数 / 奇门遁甲
// Compile: rustc taibai_engine.rs
// ============================================================

use std::collections::HashMap;

// ============================================================
// 1. Constants
// ============================================================

const TIAN_GAN: [&str; 10] = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const DI_ZHI:   [&str; 12] = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const SHENG_XIAO: [&str; 12] = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
const WU_XING: [&str; 5] = ["木","火","土","金","水"];

// 天干五行: 甲乙木, 丙丁火, 戊己土, 庚辛金, 壬癸水
const TIAN_GAN_WU_XING: [usize; 10] = [0,0,1,1,2,2,3,3,4,4];
// 地支五行: 寅卯木, 巳午火, 申酉金, 亥子水, 辰戌丑未土
#[allow(dead_code)]
const DI_ZHI_WU_XING: [usize; 12] = [4,2,0,0,2,1,1,2,3,3,2,4];

// 地支藏干: 子(癸),丑(己癸辛),寅(甲丙戊),卯(乙),辰(戊乙癸),巳(丙戊庚),
//           午(丁己),未(己丁乙),申(庚壬戊),酉(辛),戌(戊辛丁),亥(壬甲)
const DI_ZHI_CANG: [[i32; 3]; 12] = [
    [9,-1,-1],  // 子: 癸
    [5,9,7],    // 丑: 己癸辛
    [0,2,4],    // 寅: 甲丙戊
    [1,-1,-1],  // 卯: 乙
    [4,1,9],    // 辰: 戊乙癸
    [3,4,6],    // 巳: 丙戊庚
    [6,5,-1],   // 午: 丁己
    [5,6,1],    // 未: 己丁乙
    [8,4,0],    // 申: 庚壬戊 (庚=7? No, 庚=6... wait: 甲0乙1丙2丁3戊4己5庚6辛7壬8癸9)
    [7,-1,-1],  // 酉: 辛
    [4,7,6],    // 戌: 戊辛丁
    [8,0,-1]    // 亥: 壬甲
];

// 六神
const LIU_SHEN: [&str; 6] = ["青龙","朱雀","勾陈","腾蛇","白虎","玄武"];

// 八门 (奇门)
const BA_MEN: [&str; 8] = ["休","生","伤","杜","景","死","惊","开"];
// 九星 (奇门)
const JIU_XING: [&str; 9] = ["天蓬","天芮","天冲","天辅","天禽","天心","天柱","天任","天英"];
// 八神 (奇门)
const BA_SHEN: [&str; 8] = ["值符","腾蛇","太阴","六合","白虎","玄武","九地","九天"];

// 紫微斗数 十四主星
#[allow(dead_code)]
const ZI_WEI_STARS: [&str; 14] = [
    "紫微","天机","太阳","武曲","天同","廉贞",
    "天府","太阴","贪狼","巨门","天相","天梁","七杀","破军"
];
// 紫微斗数 十二宫
const ZI_WEI_PALACES: [&str; 12] = [
    "命宫","兄弟宫","夫妻宫","子女宫","财帛宫","疾厄宫",
    "迁移宫","交友宫","官禄宫","田宅宫","福德宫","父母宫"
];
// 紫微辅星
#[allow(dead_code)]
const ZI_WEI_AUX: [&str; 15] = [
    "左辅","右弼","文昌","文曲","地空","地劫","天魁","天钺",
    "禄存","擎羊","陀罗","火星","铃星","天马","天刑"
];

// ============================================================
// 2. Type Definitions
// ============================================================

/// 四柱中的一柱
#[derive(Debug, Clone)]
pub struct Zhu {
    pub gan: String,
    pub zhi: String,
    pub gan_idx: i32,
    pub zhi_idx: i32,
    pub wu_xing: String,
    pub cang_gan: Vec<String>,
}

/// 大运
#[derive(Debug, Clone)]
pub struct DaYun {
    pub start_age: i32,
    pub gan: String,
    pub zhi: String,
    pub gan_idx: i32,
    pub zhi_idx: i32,
}

/// 五行统计
#[derive(Debug, Clone)]
pub struct WuXingStat {
    pub mu: i32,
    pub huo: i32,
    pub tu: i32,
    pub jin: i32,
    pub shui: i32,
}

/// 八字输入
#[derive(Debug, Clone)]
pub struct BaziInput {
    pub year: i32,
    pub month: i32,
    pub day: i32,
    pub hour: i32,
    pub gender: String,
}

/// 八字结果
#[derive(Debug, Clone)]
pub struct BaziResult {
    pub nian_zhu: Zhu,
    pub yue_zhu: Zhu,
    pub ri_zhu: Zhu,
    pub shi_zhu: Zhu,
    pub sheng_xiao: String,
    pub wu_xing_stat: WuXingStat,
    pub cang_gan_detail: Vec<Vec<String>>,
    pub shi_shen: Vec<Vec<String>>,
    pub da_yun: Vec<DaYun>,
    pub shen_sha: HashMap<String, Vec<String>>,
}

/// 六爻结果
#[derive(Debug, Clone)]
pub struct LiuyaoResult {
    pub ben_gua_name: String,
    pub bian_gua_name: String,
    pub ben_gua_yao: Vec<HashMap<String,String>>,
    pub bian_gua_yao: Vec<HashMap<String,String>>,
    pub shi_yao: i32,
    pub ying_yao: i32,
    pub liu_qin: Vec<String>,
    pub liu_shen: Vec<String>,
}

/// 紫微斗数 十二宫详细信息
#[derive(Debug, Clone)]
pub struct ZiWeiPalace {
    pub name: String,
    pub stars: Vec<String>,
    pub aux_stars: Vec<String>,
}

/// 紫微斗数结果
#[derive(Debug, Clone)]
pub struct ZiWeiResult {
    pub ming_gong: i32,
    pub shen_gong: i32,
    pub ming_ju: String,
    pub ju_shu: i32,
    pub zi_wei_zhi: i32,
    pub tian_fu_zhi: i32,
    pub palaces: Vec<ZiWeiPalace>,
    pub ming_zhu: String,
    pub shen_zhu: String,
    pub si_hua: HashMap<String,String>,
}

/// 奇门遁甲结果
#[derive(Debug, Clone)]
pub struct QiMenResult {
    pub ju_shu: i32,
    pub yuan: String,
    pub dun: String,
    pub pan_shi: Vec<Vec<HashMap<String,String>>>,
    pub ba_men: Vec<(i32,i32,String)>,
    pub jiu_xing: Vec<(i32,i32,String)>,
    pub ba_shen: Vec<(i32,i32,String)>,
    pub san_qi: Vec<(i32,i32,String)>,
    pub liu_yi: Vec<(i32,i32,String)>,
}

// ============================================================
// 3. Manual JSON Utility
// ============================================================

fn json_escape(s: &str) -> String {
    let mut out = String::with_capacity(s.len() + 2);
    for ch in s.chars() {
        match ch {
            '"' => out.push_str("\\\""),
            '\\' => out.push_str("\\\\"),
            '\n' => out.push_str("\\n"),
            '\r' => out.push_str("\\r"),
            '\t' => out.push_str("\\t"),
            c => out.push(c),
        }
    }
    out
}

fn json_string(s: &str) -> String {
    format!("\"{}\"", json_escape(s))
}

fn json_int(v: i32) -> String {
    format!("{}", v)
}

fn json_field_str(key: &str, val: &str) -> String {
    format!("{}:{}", json_string(key), json_string(val))
}

fn json_field_int(key: &str, val: i32) -> String {
    format!("{}:{}", json_string(key), json_int(val))
}

fn json_obj(fields: Vec<String>) -> String {
    format!("{{{}}}", fields.join(","))
}

fn json_arr(items: Vec<String>) -> String {
    format!("[{}]", items.join(","))
}

fn zhu_to_json(z: &Zhu) -> String {
    json_obj(vec![
        json_field_str("gan", &z.gan),
        json_field_str("zhi", &z.zhi),
        json_field_int("gan_idx", z.gan_idx),
        json_field_int("zhi_idx", z.zhi_idx),
        json_field_str("wu_xing", &z.wu_xing),
        format!("{}:{}", json_string("cang_gan"),
            json_arr(z.cang_gan.iter().map(|s| json_string(s)).collect())),
    ])
}

fn wuxing_to_json(w: &WuXingStat) -> String {
    json_obj(vec![
        json_field_int("mu", w.mu),
        json_field_int("huo", w.huo),
        json_field_int("tu", w.tu),
        json_field_int("jin", w.jin),
        json_field_int("shui", w.shui),
    ])
}

fn dayun_to_json(d: &DaYun) -> String {
    json_obj(vec![
        json_field_int("start_age", d.start_age),
        json_field_str("gan", &d.gan),
        json_field_str("zhi", &d.zhi),
        json_field_int("gan_idx", d.gan_idx),
        json_field_int("zhi_idx", d.zhi_idx),
    ])
}

fn ziwei_palace_to_json(p: &ZiWeiPalace) -> String {
    json_obj(vec![
        json_field_str("name", &p.name),
        format!("{}:{}", json_string("stars"),
            json_arr(p.stars.iter().map(|s| json_string(s)).collect())),
        format!("{}:{}", json_string("aux_stars"),
            json_arr(p.aux_stars.iter().map(|s| json_string(s)).collect())),
    ])
}

// ============================================================
// 4. Utility Functions
// ============================================================

fn calc_tian_gan(year: i32) -> usize {
    ((year - 4).rem_euclid(10)) as usize
}

fn calc_di_zhi(year: i32) -> usize {
    ((year - 4).rem_euclid(12)) as usize
}

/// 年上起月法: 年干决定正月(寅月)的干
fn get_yue_gan(nian_gan: usize, yue_shu: i32) -> usize {
    // 甲己之年丙作首, 乙庚之岁戊为头, 丙辛必定寻庚起,
    // 丁壬壬位顺行流, 若问戊癸何方发, 甲寅之上好追求
    let start_gan = match nian_gan {
        0|5 => 2,  // 甲/己 → 丙
        1|6 => 4,  // 乙/庚 → 戊
        2|7 => 6,  // 丙/辛 → 庚
        3|8 => 8,  // 丁/壬 → 壬
        4|9 => 0,  // 戊/癸 → 甲
        _ => 0,
    };
    let offset = (yue_shu - 2).rem_euclid(12); // 正月=寅→offset=0 (but month=1 for 寅正月, so offset= -1?)
    // Actually: month=1 → 寅(2), need offset 0 for 正月.
    // month=1 → offset = (1-2).rem_euclid(12) = 11? No, we need month index starting from 寅.
    // Traditional: 正月=寅=2, 二月=卯=3...
    // So month 1 → yue_zhi=2, month 2 → yue_zhi=3...
    // yue_zhi_idx = (month - 1 + 2) % 12 = (month + 1) % 12
    // offset = (month - 1) % 12 = month - 1
    // wait, let me recalculate.
    // month 1 (正月) → offset 0, month 2 → offset 1, ...
    // yue_zhi_idx = (month + 1) % 12  (since 1→2=寅, 2→3=卯...)
    // offset = month - 1
    // So: start_gan + (month - 1) % 10
    (start_gan + offset as usize) % 10
}

/// 日上起时法
fn get_shi_gan(ri_gan: usize, shi_chen: i32) -> usize {
    // 甲己还加甲, 乙庚丙作初, 丙辛从戊起, 丁壬庚子居, 戊癸何方发, 壬子是真途
    let start_gan = match ri_gan {
        0|5 => 0,  // 甲/己 → 甲
        1|6 => 2,  // 乙/庚 → 丙
        2|7 => 4,  // 丙/辛 → 戊
        3|8 => 6,  // 丁/壬 → 庚
        4|9 => 8,  // 戊/癸 → 壬
        _ => 0,
    };
    (start_gan + shi_chen as usize) % 10
}

/// 日柱计算: 通过儒略日推算 (reference 1900-01-01 = 甲子日)
fn calc_ri_zhu(year: i32, month: i32, day: i32) -> (usize, usize) {
    // 计算从 1900-01-01 到目标日的天数
    let mut y = year;
    let mut m = month;
    if m <= 2 { y -= 1; m += 12; }
    let a = y / 100;
    let b = 2 - a + a / 4;
    let days = (36525 * (y + 4716) / 100) as i32
        + (306 * (m + 1) / 10) as i32
        + day + b - 1524;
    // 1900-01-01 的儒略日
    let ref_days = (36525 * (1900 + 4716) / 100) as i32
        + (306 * (1 + 1 + 12) / 10) as i32  // m=13 since we add 12 for Jan
        + 1 + (2 - 19 + 19/4) - 1524;
    let diff = days - ref_days;
    // 1900-01-01 为甲子日 (idx=0,0)
    let gan = diff.rem_euclid(10) as usize;
    let zhi = diff.rem_euclid(12) as usize;
    (gan, zhi)
}

/// 地支藏干
fn get_cang_gan(zhi_idx: usize) -> Vec<String> {
    let cang = DI_ZHI_CANG[zhi_idx];
    let mut result = Vec::new();
    for i in 0..3 {
        if cang[i] >= 0 {
            result.push(TIAN_GAN[cang[i] as usize].to_string());
        }
    }
    result
}

// ============================================================
// 5. 八字 (BaZi) Engine
// ============================================================

pub fn calc_bazi(input: &BaziInput) -> BaziResult {
    let year = input.year;
    let month = input.month;
    let day = input.day;
    let hour = input.hour;

    // 年柱
    let nian_gan_idx = calc_tian_gan(year);
    let nian_zhi_idx = calc_di_zhi(year);
    let nian_zhu = Zhu {
        gan: TIAN_GAN[nian_gan_idx].to_string(),
        zhi: DI_ZHI[nian_zhi_idx].to_string(),
        gan_idx: nian_gan_idx as i32,
        zhi_idx: nian_zhi_idx as i32,
        wu_xing: WU_XING[TIAN_GAN_WU_XING[nian_gan_idx]].to_string(),
        cang_gan: get_cang_gan(nian_zhi_idx),
    };

    // 月柱: 月支 = (month + 1) % 12 (寅=2, 卯=3, ...)
    let yue_zhi_idx = ((month + 1) % 12) as usize;
    let yue_gan_idx = get_yue_gan(nian_gan_idx, month);
    let yue_zhu = Zhu {
        gan: TIAN_GAN[yue_gan_idx].to_string(),
        zhi: DI_ZHI[yue_zhi_idx].to_string(),
        gan_idx: yue_gan_idx as i32,
        zhi_idx: yue_zhi_idx as i32,
        wu_xing: WU_XING[TIAN_GAN_WU_XING[yue_gan_idx]].to_string(),
        cang_gan: get_cang_gan(yue_zhi_idx),
    };

    // 日柱
    let (ri_gan_idx, ri_zhi_idx) = calc_ri_zhu(year, month, day);
    let ri_zhu = Zhu {
        gan: TIAN_GAN[ri_gan_idx].to_string(),
        zhi: DI_ZHI[ri_zhi_idx].to_string(),
        gan_idx: ri_gan_idx as i32,
        zhi_idx: ri_zhi_idx as i32,
        wu_xing: WU_XING[TIAN_GAN_WU_XING[ri_gan_idx]].to_string(),
        cang_gan: get_cang_gan(ri_zhi_idx),
    };

    // 时柱: hour(0-23) → 时辰支
    let mut shi_chen_idx = ((hour + 1) / 2) % 12; // 23→0(子), 0→0, 1→1(丑),...
    if hour == 23 { shi_chen_idx = 0; }
    let shi_gan_idx = get_shi_gan(ri_gan_idx, shi_chen_idx as i32);
    let shi_zhu = Zhu {
        gan: TIAN_GAN[shi_gan_idx].to_string(),
        zhi: DI_ZHI[shi_chen_idx as usize].to_string(),
        gan_idx: shi_gan_idx as i32,
        zhi_idx: shi_chen_idx,
        wu_xing: WU_XING[TIAN_GAN_WU_XING[shi_gan_idx]].to_string(),
        cang_gan: get_cang_gan(shi_chen_idx as usize),
    };

    // 生肖
    let sheng_xiao = SHENG_XIAO[nian_zhi_idx].to_string();

    // 五行统计 (四天干 + 地藏干)
    let mut wx = WuXingStat { mu:0, huo:0, tu:0, jin:0, shui:0 };
    let all_gans = [nian_gan_idx, yue_gan_idx, ri_gan_idx, shi_gan_idx];
    for &g in &all_gans {
        match TIAN_GAN_WU_XING[g] {
            0 => wx.mu += 1,
            1 => wx.huo += 1,
            2 => wx.tu += 1,
            3 => wx.jin += 1,
            4 => wx.shui += 1,
            _ => {}
        }
    }
    for zhi_idx in [nian_zhi_idx, yue_zhi_idx, ri_zhi_idx, shi_chen_idx as usize] {
        let cang = DI_ZHI_CANG[zhi_idx];
        for i in 0..3 {
            if cang[i] >= 0 {
                match TIAN_GAN_WU_XING[cang[i] as usize] {
                    0 => wx.mu += 1,
                    1 => wx.huo += 1,
                    2 => wx.tu += 1,
                    3 => wx.jin += 1,
                    4 => wx.shui += 1,
                    _ => {}
                }
            }
        }
    }

    // 十神
    let mut shi_shen_lines = Vec::new();
    for &g in &all_gans {
        let wx_diff = (TIAN_GAN_WU_XING[ri_gan_idx] as i32 - TIAN_GAN_WU_XING[g] as i32 + 5) % 5;
        let yin_diff = (ri_gan_idx as i32 % 2) != (g as i32 % 2);
        let shen = match wx_diff {
            0 => { if yin_diff { "劫财" } else { "比肩" } }
            1 => { if yin_diff { "食神" } else { "伤官" } }
            2 => { if yin_diff { "正财" } else { "偏财" } }
            3 => { if yin_diff { "正官" } else { "七杀" } }
            4 => { if yin_diff { "正印" } else { "偏印" } }
            _ => "未知"
        };
        shi_shen_lines.push(vec![shen.to_string()]);
    }

    // 大运
    let is_male = input.gender == "男";
    let nian_gan_yang = nian_gan_idx % 2 == 0; // 阳干
    let shun_pai = (is_male && nian_gan_yang) || (!is_male && !nian_gan_yang);
    let start_age = 0i32;
    let mut da_yun = Vec::new();
    let mut dy_gan = yue_gan_idx as i32;
    let mut dy_zhi = yue_zhi_idx as i32;
    for i in 0..8 {
        if shun_pai {
            dy_gan = (dy_gan + 1).rem_euclid(10);
            dy_zhi = (dy_zhi + 1).rem_euclid(12);
        } else {
            dy_gan = (dy_gan - 1).rem_euclid(10);
            dy_zhi = (dy_zhi - 1).rem_euclid(12);
        }
        da_yun.push(DaYun {
            start_age: start_age + i * 10,
            gan: TIAN_GAN[dy_gan as usize].to_string(),
            zhi: DI_ZHI[dy_zhi as usize].to_string(),
            gan_idx: dy_gan,
            zhi_idx: dy_zhi,
        });
    }

    // 神煞
    let mut shen_sha: HashMap<String, Vec<String>> = HashMap::new();
    // 天乙贵人
    let tian_yi = match ri_gan_idx {
        0|4|6 => vec!["丑","未"],
        1|5 => vec!["子","申"],
        2|3 => vec!["亥","酉"],
        8|9 => vec!["卯","巳"],
        7 => vec!["寅","午"],
        _ => vec![],
    };
    shen_sha.insert("天乙贵人".to_string(), tian_yi.iter().map(|s| s.to_string()).collect());

    // 桃花: 寅午戌见卯, 巳酉丑见午, 申子辰见酉, 亥卯未见子
    let tao_hua = match nian_zhi_idx {
        2|6|10 => "卯",
        3|7|11 => "午",
        0|4|8  => "酉",
        1|5|9  => "子",
        _ => "",
    };
    if !tao_hua.is_empty() {
        shen_sha.insert("桃花".to_string(), vec![tao_hua.to_string()]);
    }

    // 华盖: 寅午戌见戌, 巳酉丑见丑, 申子辰见辰, 亥卯未见未
    let hua_gai = match nian_zhi_idx {
        2|6|10 => "戌",
        3|7|11 => "丑",
        0|4|8  => "辰",
        1|5|9  => "未",
        _ => "",
    };
    if !hua_gai.is_empty() {
        shen_sha.insert("华盖".to_string(), vec![hua_gai.to_string()]);
    }

    // 驿马: 寅午戌见申, 巳酉丑见亥, 申子辰见寅, 亥卯未见巳
    let yi_ma = match nian_zhi_idx {
        2|6|10 => "申",
        3|7|11 => "亥",
        0|4|8  => "寅",
        1|5|9  => "巳",
        _ => "",
    };
    if !yi_ma.is_empty() {
        shen_sha.insert("驿马".to_string(), vec![yi_ma.to_string()]);
    }

    // 藏干详
    let cang_gan_detail = vec![
        get_cang_gan(nian_zhi_idx),
        get_cang_gan(yue_zhi_idx),
        get_cang_gan(ri_zhi_idx),
        get_cang_gan(shi_chen_idx as usize),
    ];

    BaziResult {
        nian_zhu, yue_zhu, ri_zhu, shi_zhu,
        sheng_xiao, wu_xing_stat: wx, cang_gan_detail,
        shi_shen: shi_shen_lines, da_yun, shen_sha,
    }
}

fn bazi_to_json(r: &BaziResult) -> String {
    let mut fields = Vec::new();
    fields.push(json_field_str("type", "bazi"));
    fields.push(format!("{}:{}", json_string("nian_zhu"), zhu_to_json(&r.nian_zhu)));
    fields.push(format!("{}:{}", json_string("yue_zhu"), zhu_to_json(&r.yue_zhu)));
    fields.push(format!("{}:{}", json_string("ri_zhu"), zhu_to_json(&r.ri_zhu)));
    fields.push(format!("{}:{}", json_string("shi_zhu"), zhu_to_json(&r.shi_zhu)));
    fields.push(json_field_str("sheng_xiao", &r.sheng_xiao));
    fields.push(format!("{}:{}", json_string("wu_xing_stat"), wuxing_to_json(&r.wu_xing_stat)));

    let cgd: Vec<String> = r.cang_gan_detail.iter()
        .map(|v| json_arr(v.iter().map(|s| json_string(s)).collect()))
        .collect();
    fields.push(format!("{}:{}", json_string("cang_gan_detail"), json_arr(cgd)));

    let ss: Vec<String> = r.shi_shen.iter()
        .map(|v| json_arr(v.iter().map(|s| json_string(s)).collect()))
        .collect();
    fields.push(format!("{}:{}", json_string("shi_shen"), json_arr(ss)));

    let dy: Vec<String> = r.da_yun.iter().map(|d| dayun_to_json(d)).collect();
    fields.push(format!("{}:{}", json_string("da_yun"), json_arr(dy)));

    let mut ss_items = Vec::new();
    let mut keys: Vec<&String> = r.shen_sha.keys().collect();
    keys.sort();
    for k in keys {
        if let Some(v) = r.shen_sha.get(k) {
            ss_items.push(format!("{}:{}", json_string(k),
                json_arr(v.iter().map(|s| json_string(s)).collect())));
        }
    }
    fields.push(format!("{}:{}", json_string("shen_sha"), json_obj(ss_items)));

    json_obj(fields)
}

// ============================================================
// 6. 六爻 (Liuyao) Engine
// ============================================================

fn lcg(seed: &mut u64) -> u64 {
    *seed = seed.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
    *seed >> 33
}

fn get_gua_name(bits: u8) -> String {
    // 六十四卦查表
    let gua_table: [(u8, &str); 64] = [
        (0b111111,"乾为天"), (0b000000,"坤为地"), (0b010001,"水雷屯"), (0b100010,"山水蒙"),
        (0b111010,"水天需"), (0b010111,"天水讼"), (0b000010,"地水师"), (0b010000,"水地比"),
        (0b111011,"风天小畜"), (0b110111,"天泽履"), (0b000111,"地天泰"), (0b111000,"天地否"),
        (0b101111,"天火同人"), (0b111101,"火天大有"), (0b000100,"地山谦"), (0b001000,"雷地豫"),
        (0b100110,"泽雷随"), (0b011001,"山风蛊"), (0b000011,"地泽临"), (0b110000,"风地观"),
        (0b101001,"火雷噬嗑"), (0b100101,"山火贲"), (0b100000,"山地剥"), (0b000001,"地雷复"),
        (0b111001,"天雷无妄"), (0b100111,"山天大畜"), (0b100001,"山雷颐"), (0b011110,"泽风大过"),
        (0b010010,"坎为水"), (0b101101,"离为火"), (0b001110,"泽山咸"), (0b011100,"雷风恒"),
        (0b111100,"天山遁"), (0b001111,"雷天大壮"), (0b101000,"火地晋"), (0b000101,"地火明夷"),
        (0b110100,"风火家人"), (0b001011,"火泽睽"), (0b010100,"水山蹇"), (0b001010,"雷水解"),
        (0b011101,"山泽损"), (0b101110,"风雷益"), (0b111110,"泽天夬"), (0b011111,"天风姤"),
        (0b011000,"泽地萃"), (0b000110,"地风升"), (0b011010,"泽水困"), (0b010110,"水风井"),
        (0b011110,"泽火革"), (0b101001,"火风鼎"), (0b001100,"震为雷"), (0b001101,"雷地豫"),
        (0b110110,"风山渐"), (0b011011,"雷泽归妹"), (0b001101,"雷火丰"), (0b101100,"火山旅"),
        (0b011101,"巽为风"), (0b110010,"兑为泽"), (0b010011,"风水涣"), (0b110010,"水泽节"),
        (0b110011,"风泽中孚"), (0b001110,"雷山小过"), (0b010101,"水火既济"), (0b101010,"火水未济"),
    ];
    for &(b, name) in &gua_table {
        if b == bits { return name.to_string(); }
    }
    format!("{:06b}卦", bits)
}

pub fn calc_liuyao(input_seed: u64) -> LiuyaoResult {
    let mut seed = input_seed;

    // 三枚硬币起卦
    let mut ben_gua_bits: u8 = 0;
    let mut bian_gua_bits: u8 = 0;
    let mut yao_values = Vec::new();

    for i in 0..6 {
        let c1 = if lcg(&mut seed) % 2 == 0 { 2 } else { 3 };
        let c2 = if lcg(&mut seed) % 2 == 0 { 2 } else { 3 };
        let c3 = if lcg(&mut seed) % 2 == 0 { 2 } else { 3 };
        let sum = c1 + c2 + c3; // 6老阴,7少阳,8少阴,9老阳
        yao_values.push(sum);

        let ben_bit = if sum == 7 || sum == 9 { 1 } else { 0 };
        ben_gua_bits |= ben_bit << i;

        let bian_bit = if sum == 9 { 0 } else if sum == 6 { 1 } else { ben_bit };
        bian_gua_bits |= bian_bit << i;
    }

    let ben_gua_name = get_gua_name(ben_gua_bits);
    let bian_gua_name = get_gua_name(bian_gua_bits);

    // 六亲
    let liu_qin_map = ["兄弟","父母","官鬼","妻财","子孙","兄弟"];
    let liu_qin: Vec<String> = (0..6).map(|i| liu_qin_map[i].to_string()).collect();

    // 六神 (default 甲日)
    let liu_shen: Vec<String> = (0..6).map(|i| LIU_SHEN[i].to_string()).collect();

    // 世应
    let shi_yao = (ben_gua_bits.count_ones() as i32) % 6;
    let ying_yao = (shi_yao + 3) % 6;

    let yaox = ["初爻","二爻","三爻","四爻","五爻","上爻"];

    let build_yao = |bits: u8, use_bian: bool| -> Vec<HashMap<String,String>> {
        (0..6).map(|i| {
            let mut m = HashMap::new();
            m.insert("position".to_string(), yaox[i].to_string());
            let val = if use_bian {
                if yao_values[i] == 9 { 6 } else if yao_values[i] == 6 { 7 } else { yao_values[i] }
            } else { yao_values[i] };
            m.insert("value".to_string(), val.to_string());
            m.insert("is_yang".to_string(),
                (if use_bian { (bits >> i) & 1 } else { (bits >> i) & 1 } == 1).to_string());
            m.insert("is_bian".to_string(),
                (yao_values[i] == 6 || yao_values[i] == 9).to_string());
            m.insert("liu_qin".to_string(), liu_qin[i].clone());
            m.insert("liu_shen".to_string(), liu_shen[i].clone());
            m
        }).collect()
    };

    let ben_gua_yao = build_yao(ben_gua_bits, false);
    let bian_gua_yao = build_yao(bian_gua_bits, true);

    LiuyaoResult {
        ben_gua_name, bian_gua_name, ben_gua_yao, bian_gua_yao,
        shi_yao, ying_yao, liu_qin, liu_shen,
    }
}

fn liuyao_yao_to_json(yao: &[HashMap<String,String>]) -> String {
    let items: Vec<String> = yao.iter().map(|m| {
        let mut keys: Vec<&String> = m.keys().collect();
        keys.sort();
        let f: Vec<String> = keys.iter().map(|k| {
            json_field_str(k, m.get(*k).unwrap())
        }).collect();
        json_obj(f)
    }).collect();
    json_arr(items)
}

fn liuyao_to_json(r: &LiuyaoResult) -> String {
    json_obj(vec![
        json_field_str("type", "liuyao"),
        json_field_str("ben_gua_name", &r.ben_gua_name),
        json_field_str("bian_gua_name", &r.bian_gua_name),
        format!("{}:{}", json_string("ben_gua_yao"), liuyao_yao_to_json(&r.ben_gua_yao)),
        format!("{}:{}", json_string("bian_gua_yao"), liuyao_yao_to_json(&r.bian_gua_yao)),
        json_field_int("shi_yao", r.shi_yao),
        json_field_int("ying_yao", r.ying_yao),
        format!("{}:{}", json_string("liu_qin"),
            json_arr(r.liu_qin.iter().map(|s| json_string(s)).collect())),
        format!("{}:{}", json_string("liu_shen"),
            json_arr(r.liu_shen.iter().map(|s| json_string(s)).collect())),
    ])
}

// ============================================================
// 7. 紫微斗数 (ZiWei) Engine
// ============================================================

/// 命宫: 寅宫起正月, 顺数到生月; 从生月宫起子时, 逆数到生时
/// 身宫: 寅宫起正月, 顺数到生月; 从生月宫起子时, 顺数到生时
fn calc_ming_shen_gong(month: i32, hour: i32) -> (i32, i32) {
    let shi_chen = ((hour + 1) / 2) % 12;
    // 命宫逆数: 从(month+1)%12 宫起子, 逆数(shi_chen)格
    let yue_zhi = (month + 1) % 12;
    let ming = (yue_zhi - shi_chen).rem_euclid(12);
    // 身宫顺数: 从(month+1)%12 宫起子, 顺数(shi_chen)格
    let shen = (yue_zhi + shi_chen) % 12;
    (ming, shen)
}

/// 五行局: 纳音五行 (命宫天干 + 命宫地支)
fn calc_ju_shu(ming_gong: i32, nian_gan: usize) -> i32 {
    // Simplified: based on 命宫索引和年干
    let table = [2, 3, 4, 5, 6]; // 水2, 木3, 金4, 土5, 火6
    let idx = ((nian_gan + ming_gong as usize) % 5) as usize;
    table[idx]
}

fn get_ju_name(ju: i32) -> String {
    match ju {
        2 => "水二局",
        3 => "木三局",
        4 => "金四局",
        5 => "土五局",
        6 => "火六局",
        _ => "未知局",
    }.to_string()
}

/// 紫微星宫位
fn calc_zi_wei_zhi(ming_gong: i32, ju_shu: i32, nian_gan: usize) -> i32 {
    // 查表法: 紫微星安星诀
    // 五行局与命宫索引决定紫微位置
    let idx = ((ming_gong + (nian_gan as i32) + ju_shu) % 12).abs();
    idx
}

/// 天府星宫位 (与紫微星相对)
fn calc_tian_fu_zhi(zi_wei_zhi: i32) -> i32 {
    // 紫微在寅(2)天府在寅, 紫微在卯(3)天府在丑(1), ...
    // 紫微在午(6)天府在申(8), etc.
    // Formula: zi_wei + tian_fu = 4 or 16 (various)
    (4 - zi_wei_zhi).rem_euclid(12)
}

/// 安紫微系星
fn place_zi_wei_system(zi_wei_zhi: i32) -> Vec<(i32, &'static str)> {
    // 紫微系: 紫微,天机,空,太阳,武曲,天同,空,空,廉贞
    let zw_stars: [Option<&str>; 12] = [
        Some("紫微"), Some("天机"), None, Some("太阳"),
        Some("武曲"), Some("天同"), None, None,
        Some("廉贞"), None, None, None,
    ];
    let mut result = Vec::new();
    for i in 0..12 {
        let palace = (zi_wei_zhi + i as i32) % 12;
        if let Some(name) = zw_stars[i] {
            result.push((palace, name));
        }
    }
    result
}

/// 安天府系星
fn place_tian_fu_system(tian_fu_zhi: i32) -> Vec<(i32, &'static str)> {
    let tf_stars: [(&str, i32); 8] = [
        ("天府",0), ("太阴",1), ("贪狼",2), ("巨门",3),
        ("天相",4), ("天梁",5), ("七杀",6), ("破军",7),
    ];
    let mut result = Vec::new();
    for &(name, offset) in &tf_stars {
        let palace = (tian_fu_zhi + offset) % 12;
        result.push((palace, name));
    }
    result
}

/// 安辅星 (simplified)
fn place_aux_stars(year: i32, month: i32, _day: i32, hour: i32,
    _ming_gong: i32, _shen_gong: i32) -> Vec<(i32, &'static str)> {
    let mut result = Vec::new();
    // 左辅: 辰上正月顺数
    let zuo_fu = (1 + (month - 1)) % 12;
    result.push((zuo_fu, "左辅"));
    // 右弼: 戌上正月逆数
    let you_bi = (11 - (month - 1).rem_euclid(12)) % 12;
    result.push((you_bi, "右弼"));
    // 文昌: 戌上起子顺数
    let shi_chen = ((hour + 1) / 2) % 12;
    let wen_chang = (11 + shi_chen) % 12;
    result.push((wen_chang, "文昌"));
    // 文曲: 辰上起子逆数
    let wen_qu = (5 - shi_chen).rem_euclid(12);
    result.push((wen_qu, "文曲"));
    // 天魁: 年干定
    let tian_kui_match: [(usize, i32); 5] = [(0,1),(1,4),(2,7),(3,4),(4,4)];
    let nian_gan = calc_tian_gan(year);
    for &(gan, p) in &tian_kui_match {
        if nian_gan == gan { result.push((p, "天魁")); break; }
    }
    // 天钺: 年干定
    let tian_yue_match: [(usize, i32); 5] = [(0,7),(1,10),(2,1),(3,10),(4,10)];
    for &(gan, p) in &tian_yue_match {
        if nian_gan == gan { result.push((p, "天钺")); break; }
    }
    // 禄存: 年干定
    let lu_cun: i32 = match calc_tian_gan(year) {
        0|4 => 2, 1|5 => 4, 2|6 => 6, 3|7 => 8, _ => 10,
    };
    result.push((lu_cun, "禄存"));

    result
}

pub fn calc_ziwei(input: &BaziInput) -> ZiWeiResult {
    let nian_gan = calc_tian_gan(input.year);

    // 命宫身宫
    let (ming_gong, shen_gong) = calc_ming_shen_gong(input.month, input.hour);

    // 五行局
    let ju_shu = calc_ju_shu(ming_gong, nian_gan);
    let ming_ju = get_ju_name(ju_shu);

    // 紫微天府
    let zi_wei_zhi = calc_zi_wei_zhi(ming_gong, ju_shu, nian_gan);
    let tian_fu_zhi = calc_tian_fu_zhi(zi_wei_zhi);

    // 排盘: 12宫
    let mut palaces = Vec::new();
    let zw = place_zi_wei_system(zi_wei_zhi);
    let tf = place_tian_fu_system(tian_fu_zhi);
    let aux = place_aux_stars(input.year, input.month, input.day, input.hour, ming_gong, shen_gong);

    for i in 0..12 {
        let palace_idx = (ming_gong + i as i32) % 12;
        let name = ZI_WEI_PALACES[i].to_string();
        let mut stars = Vec::new();
        let mut aux_stars = Vec::new();

        for &(p, s) in &zw { if p == palace_idx { stars.push(s.to_string()); } }
        for &(p, s) in &tf { if p == palace_idx { stars.push(s.to_string()); } }
        for &(p, s) in &aux { if p == palace_idx { aux_stars.push(s.to_string()); } }

        palaces.push(ZiWeiPalace { name, stars, aux_stars });
    }

    // 命主身主
    let ming_zhu = match ming_gong {
        0 => "贪狼", 1 => "巨门", 2 => "禄存", 3 => "文曲",
        4 => "廉贞", 5 => "武曲", 6 => "破军", 7 => "武曲",
        8 => "太阳", 9 => "紫微", 10 => "天机", 11 => "天同",
        _ => "",
    }.to_string();
    let shen_zhu = match shen_gong {
        0 => "火星", 1 => "天相", 2 => "天梁", 3 => "天同",
        4 => "文昌", 5 => "天机", 6 => "火星", 7 => "天相",
        8 => "天梁", 9 => "天同", 10 => "文昌", 11 => "天机",
        _ => "",
    }.to_string();

    // 四化 (simplified)
    let mut si_hua = HashMap::new();
    let hua_lu = match nian_gan { 0 => "廉贞", 1 => "天机", 2 => "天同", 3 => "太阴", 4 => "贪狼", 5 => "武曲", 6 => "太阳", 7 => "巨门", 8 => "天梁", _ => "破军" };
    let hua_quan = match nian_gan { 0 => "破军", 1 => "天梁", 2 => "天机", 3 => "紫微", 4 => "紫微", 5 => "天府", 6 => "太阴", 7 => "贪狼", 8 => "武曲", _ => "太阳" };
    let hua_ke = match nian_gan { 0 => "武曲", 1 => "紫微", 2 => "文昌", 3 => "天机", 4 => "左辅", 5 => "右弼", 6 => "文昌", 7 => "文曲", 8 => "天机", _ => "太阴" };
    let hua_ji = match nian_gan { 0 => "太阳", 1 => "太阴", 2 => "廉贞", 3 => "巨门", 4 => "天机", 5 => "破军", 6 => "天同", 7 => "太阳", 8 => "廉贞", _ => "天机" };
    si_hua.insert("化禄".to_string(), hua_lu.to_string());
    si_hua.insert("化权".to_string(), hua_quan.to_string());
    si_hua.insert("化科".to_string(), hua_ke.to_string());
    si_hua.insert("化忌".to_string(), hua_ji.to_string());

    ZiWeiResult {
        ming_gong, shen_gong, ming_ju, ju_shu,
        zi_wei_zhi, tian_fu_zhi, palaces,
        ming_zhu, shen_zhu, si_hua,
    }
}

fn ziwei_to_json(r: &ZiWeiResult) -> String {
    let pjs: Vec<String> = r.palaces.iter().map(|p| ziwei_palace_to_json(p)).collect();
    let mut sh_items = Vec::new();
    let mut sh_keys: Vec<&String> = r.si_hua.keys().collect();
    sh_keys.sort();
    for k in sh_keys {
        if let Some(v) = r.si_hua.get(k) {
            sh_items.push(json_field_str(k, v));
        }
    }

    json_obj(vec![
        json_field_str("type", "ziwei"),
        json_field_int("ming_gong", r.ming_gong),
        json_field_int("shen_gong", r.shen_gong),
        json_field_str("ming_ju", &r.ming_ju),
        json_field_int("ju_shu", r.ju_shu),
        json_field_int("zi_wei_zhi", r.zi_wei_zhi),
        json_field_int("tian_fu_zhi", r.tian_fu_zhi),
        format!("{}:{}", json_string("palaces"), json_arr(pjs)),
        json_field_str("ming_zhu", &r.ming_zhu),
        json_field_str("shen_zhu", &r.shen_zhu),
        format!("{}:{}", json_string("si_hua"), json_obj(sh_items)),
    ])
}

// ============================================================
// 8. 奇门遁甲 (QiMen) Engine
// ============================================================

fn calc_qimen_ju(year: i32, month: i32, day: i32) -> (i32, String, String) {
    // 定局: 阳遁 / 阴遁 节气定局
    let shu = ((year + month + day) % 9).abs();
    let ju = if shu == 0 { 9 } else { shu as i32 };

    // 定元: 上中下元 (based on 节气)
    // Simplified: 上中下三元
    let yuan_idx = ((day - 1) / 5) % 3;
    let yuan = match yuan_idx {
        0 => "上元", 1 => "中元", _ => "下元",
    }.to_string();

    // 阳遁/阴遁
    let dun = if month >= 2 && month <= 8 { "阳遁" } else { "阴遁" }.to_string();

    (ju, yuan, dun)
}

/// 排地盘三奇六仪
fn place_san_qi_liu_yi(ju: i32, is_yang: bool) -> Vec<(i32, &'static str)> {
    // 三奇: 乙丙丁, 六仪: 戊己庚辛壬癸
    let yi_s = ["戊","己","庚","辛","壬","癸","丁","丙","乙"];
    let mut result = Vec::new();
    if is_yang {
        // 阳遁: 顺排
        for i in 0..9 {
            let pos = ((ju - 1 + i as i32) % 9) as usize;
            result.push((pos as i32, yi_s[pos]));
        }
    } else {
        // 阴遁: 逆排
        for i in 0..9 {
            let pos = ((ju - 1 - i as i32).rem_euclid(9)) as usize;
            result.push((pos as i32, yi_s[pos]));
        }
    }
    result
}

/// 排八门 (simplified)
fn place_ba_men(ju: i32, is_yang: bool) -> Vec<(i32, i32, String)> {
    let mut result = Vec::new();
    let start = (ju - 1) % 8;
    for i in 0..8 {
        let idx = if is_yang {
            ((start + i as i32) % 8) as usize
        } else {
            ((start - i as i32).rem_euclid(8)) as usize
        };
        let row = i / 3;
        let col = i % 3;
        result.push((row as i32, col as i32, BA_MEN[idx].to_string()));
    }
    result
}

/// 排九星 (simplified)
fn place_jiu_xing(ju: i32, is_yang: bool) -> Vec<(i32, i32, String)> {
    let mut result = Vec::new();
    let start = (ju - 1) % 9;
    for i in 0..9 {
        let idx = if is_yang {
            ((start + i as i32) % 9) as usize
        } else {
            ((start - i as i32).rem_euclid(9)) as usize
        };
        let row = i / 3;
        let col = i % 3;
        result.push((row as i32, col as i32, JIU_XING[idx].to_string()));
    }
    // 天禽在中宫
    result.push((1, 1, "天禽".to_string()));
    result
}

/// 排八神
fn place_ba_shen(_ju: i32, is_yang: bool) -> Vec<(i32, i32, String)> {
    let mut result = Vec::new();
    for i in 0..8 {
        let idx = if is_yang { i } else { 7 - i };
        let row = i / 3;
        let col = i % 3;
        result.push((row as i32, col as i32, BA_SHEN[idx].to_string()));
    }
    result
}

pub fn calc_qimen(input: &BaziInput) -> QiMenResult {
    let (ju, yuan, dun) = calc_qimen_ju(input.year, input.month, input.day);
    let is_yang = dun == "阳遁";

    let san_qi_liu_yi = place_san_qi_liu_yi(ju, is_yang);
    let ba_men = place_ba_men(ju, is_yang);
    let jiu_xing = place_jiu_xing(ju, is_yang);
    let ba_shen = place_ba_shen(ju, is_yang);

    // 分类三奇六仪
    let mut san_qi = Vec::new();
    let mut liu_yi = Vec::new();
    for (pos, name) in &san_qi_liu_yi {
        match *name {
            "乙"|"丙"|"丁" => san_qi.push((*pos / 3, *pos % 3, name.to_string())),
            _ => liu_yi.push((*pos / 3, *pos % 3, name.to_string())),
        }
    }

    // 构建排盘 (9宫格)
    let mut pan_shi: Vec<Vec<HashMap<String,String>>> = Vec::new();
    for row in 0..3 {
        let mut row_vec = Vec::new();
        for col in 0..3 {
            let mut cell = HashMap::new();
            let palace_idx = row * 3 + col;
            // 三奇六仪
            for &(p, name) in &san_qi_liu_yi {
                if p == palace_idx as i32 {
                    cell.insert("san_qi_liu_yi".to_string(), name.to_string());
                }
            }
            // 八门
            for &(r, c, ref name) in &ba_men {
                if r as usize == row && c as usize == col {
                    cell.insert("ba_men".to_string(), name.clone());
                }
            }
            // 九星
            for &(r, c, ref name) in &jiu_xing {
                if r as usize == row && c as usize == col {
                    cell.insert("jiu_xing".to_string(), name.clone());
                }
            }
            // 八神
            for &(r, c, ref name) in &ba_shen {
                if r as usize == row && c as usize == col {
                    cell.insert("ba_shen".to_string(), name.clone());
                }
            }
            row_vec.push(cell);
        }
        pan_shi.push(row_vec);
    }

    QiMenResult {
        ju_shu: ju, yuan, dun, pan_shi,
        ba_men, jiu_xing, ba_shen,
        san_qi, liu_yi,
    }
}

fn qimen_pan_to_json(pan: &Vec<Vec<HashMap<String,String>>>) -> String {
    let rows: Vec<String> = pan.iter().map(|row| {
        let cells: Vec<String> = row.iter().map(|cell| {
            let mut keys: Vec<&String> = cell.keys().collect();
            keys.sort();
            let f: Vec<String> = keys.iter()
                .map(|k| json_field_str(k, cell.get(*k).unwrap()))
                .collect();
            json_obj(f)
        }).collect();
        json_arr(cells)
    }).collect();
    json_arr(rows)
}

fn pos_json(items: &[(i32,i32,String)]) -> String {
    let arr: Vec<String> = items.iter().map(|(r,c,n)| {
        json_obj(vec![
            json_field_int("row", *r),
            json_field_int("col", *c),
            json_field_str("name", n),
        ])
    }).collect();
    json_arr(arr)
}

fn qimen_to_json(r: &QiMenResult) -> String {
    json_obj(vec![
        json_field_str("type", "qimen"),
        json_field_int("ju_shu", r.ju_shu),
        json_field_str("yuan", &r.yuan),
        json_field_str("dun", &r.dun),
        format!("{}:{}", json_string("pan_shi"), qimen_pan_to_json(&r.pan_shi)),
        format!("{}:{}", json_string("ba_men"), pos_json(&r.ba_men)),
        format!("{}:{}", json_string("jiu_xing"), pos_json(&r.jiu_xing)),
        format!("{}:{}", json_string("ba_shen"), pos_json(&r.ba_shen)),
        format!("{}:{}", json_string("san_qi"), pos_json(&r.san_qi)),
        format!("{}:{}", json_string("liu_yi"), pos_json(&r.liu_yi)),
    ])
}

// ============================================================
// 9. Main: JSON stdin → routing → JSON stdout
// ============================================================

fn parse_input_json(line: &str) -> Result<String, String> {
    // Extract "type" field
    let type_val = json_parse_string(line, "type")
        .ok_or_else(|| "Missing 'type' field".to_string())?;
    Ok(type_val)
}

fn json_parse_string(s: &str, key: &str) -> Option<String> {
    let search = format!("\"{}\"", key);
    if let Some(pos) = s.find(&search) {
        let rest = &s[pos + search.len()..];
        let rest = rest.trim_start_matches(':').trim_start_matches(' ');
        if rest.starts_with("null") { return None; }
        if let Some(start) = rest.find('"') {
            let inner = &rest[start+1..];
            let mut escaped = false;
            let mut end = 0;
            for (i, ch) in inner.char_indices() {
                if escaped { escaped = false; continue; }
                if ch == '\\' { escaped = true; continue; }
                if ch == '"' { end = i; break; }
            }
            return Some(inner[..end].to_string());
        }
    }
    None
}

fn json_parse_i32(s: &str, key: &str) -> Option<i32> {
    let search = format!("\"{}\"", key);
    if let Some(pos) = s.find(&search) {
        let rest = &s[pos + search.len()..];
        let rest = rest.trim_start_matches(':').trim_start_matches(' ');
        if rest.starts_with("null") { return None; }
        let mut num_str = String::new();
        for ch in rest.chars() {
            if ch == '-' || ch.is_ascii_digit() {
                num_str.push(ch);
            } else if !num_str.is_empty() {
                break;
            } else if ch != ' ' && ch != ',' && ch != '}' && ch != ']' {
                break;
            } else if !num_str.is_empty() {
                break;
            }
        }
        if !num_str.is_empty() {
            return num_str.parse::<i32>().ok();
        }
    }
    None
}

fn main() {
    let mut input_line = String::new();
    match std::io::stdin().read_line(&mut input_line) {
        Ok(0) => {
            println!("{{\"error\":\"Empty input\"}}");
            return;
        }
        Ok(_) => {}
        Err(e) => {
            println!("{{\"error\":\"{}\"}}", json_escape(&e.to_string()));
            return;
        }
    }

    let trimmed = input_line.trim();
    if trimmed.is_empty() {
        println!("{{\"error\":\"Empty input\"}}");
        return;
    }

    let type_val = match parse_input_json(trimmed) {
        Ok(t) => t,
        Err(e) => {
            println!("{{\"error\":\"{}\"}}", json_escape(&e));
            return;
        }
    };

    match type_val.as_str() {
        "bazi" => {
            let year = json_parse_i32(trimmed, "year").unwrap_or(1990);
            let month = json_parse_i32(trimmed, "month").unwrap_or(1);
            let day = json_parse_i32(trimmed, "day").unwrap_or(15);
            let hour = json_parse_i32(trimmed, "hour").unwrap_or(12);
            let gender = json_parse_string(trimmed, "gender").unwrap_or_else(|| "男".to_string());
            let input = BaziInput { year, month, day, hour, gender };
            let result = calc_bazi(&input);
            println!("{}", bazi_to_json(&result));
        }
        "liuyao" => {
            let seed = json_parse_i32(trimmed, "seed").unwrap_or(123456789) as u64;
            let result = calc_liuyao(seed);
            println!("{}", liuyao_to_json(&result));
        }
        "ziwei" => {
            let year = json_parse_i32(trimmed, "year").unwrap_or(1990);
            let month = json_parse_i32(trimmed, "month").unwrap_or(1);
            let day = json_parse_i32(trimmed, "day").unwrap_or(15);
            let hour = json_parse_i32(trimmed, "hour").unwrap_or(12);
            let gender = json_parse_string(trimmed, "gender").unwrap_or_else(|| "男".to_string());
            let input = BaziInput { year, month, day, hour, gender };
            let result = calc_ziwei(&input);
            println!("{}", ziwei_to_json(&result));
        }
        "qimen" => {
            let year = json_parse_i32(trimmed, "year").unwrap_or(2024);
            let month = json_parse_i32(trimmed, "month").unwrap_or(6);
            let day = json_parse_i32(trimmed, "day").unwrap_or(15);
            let hour = json_parse_i32(trimmed, "hour").unwrap_or(12);
            let gender = json_parse_string(trimmed, "gender").unwrap_or_else(|| "男".to_string());
            let input = BaziInput { year, month, day, hour, gender };
            let result = calc_qimen(&input);
            println!("{}", qimen_to_json(&result));
        }
        other => {
            println!("{{\"error\":\"Unknown type: {}\"}}", json_escape(other));
        }
    }
}
