#!/usr/bin/env python3
"""
小宇宙主播后台单集详情页数据抓取脚本
用法: python3 xiaoyuzhou_podcaster_scraper.py
需要: 已登录的小宇宙主播后台 + Kimi WebBridge
"""
import json, requests, time, sys
from datetime import datetime

WEBBRIDGE_URL = "http://127.0.0.1:10086/command"
DASHBOARD_URL = "https://podcaster.xiaoyuzhoufm.com/podcast/6937e346b4aafce2bbf27627/data-analysis/content"

def wb(action, args=None, session="xiaoyuzhou"):
    """调用 WebBridge"""
    payload = {"action": action, "args": args or {}, "session": session}
    r = requests.post(WEBBRIDGE_URL, json=payload, timeout=30)
    return r.json()

def get_page_info():
    """获取当前页面信息"""
    result = wb("snapshot")
    return result.get("data", {})

def click_element(ref):
    """点击元素"""
    return wb("click", {"selector": ref})

def evaluate_js(code):
    """执行 JS"""
    return wb("evaluate", {"code": code})

def navigate(url):
    """导航到页面"""
    return wb("navigate", {"url": url, "newTab": True})

def extract_retention_data():
    """提取留存趋势数据"""
    js = r"""
    (function(){
        const svg = document.querySelectorAll("svg")[16];
        if (!svg) return null;
        const circles = Array.from(svg.querySelectorAll("circle"));
        const texts = Array.from(svg.querySelectorAll("text")).map(t => t.textContent);
        // 提取 X 轴标签（时间刻度）
        const timeLabels = texts.filter(t => t.includes(":") || t.match(/^\d+$/));
        const points = circles.map(c => ({
            cx: parseFloat(c.getAttribute("cx")),
            cy: parseFloat(c.getAttribute("cy")),
            rate: Math.round((1 - parseFloat(c.getAttribute("cy")) / 200) * 1000) / 10
        }));
        return JSON.stringify({count: points.length, points: points, timeLabels: timeLabels.slice(0, 20)});
    })()
    """
    result = evaluate_js(js)
    if result.get("ok"):
        data = json.loads(result["data"]["value"])
        return data
    return None

def extract_interaction_heat():
    """提取互动热度数据"""
    js = r"""
    (function(){
        const svgs = document.querySelectorAll("svg");
        // 找互动热度 SVG（paths 最多的那个）
        let heatSvg = null;
        let maxPaths = 0;
        for (const svg of svgs) {
            const paths = svg.querySelectorAll("path").length;
            if (paths > maxPaths && paths > 30) {
                maxPaths = paths;
                heatSvg = svg;
            }
        }
        if (!heatSvg) return null;
        const paths = Array.from(heatSvg.querySelectorAll("path"));
        const bars = [];
        for (const p of paths) {
            const d = p.getAttribute("d");
            // 提取柱子高度：从 path 的 y 坐标推算
            const match = d.match(/M([\d.]+),(\d+(?:\.\d+)?).*L[\d.]+,(\d+(?:\.\d+)?)/);
            if (match) {
                const y1 = parseFloat(match[2]);
                const y2 = parseFloat(match[3]);
                const height = Math.abs(y2 - y1);
                // viewBox 高度 200，假设最大值对应 Y 轴最大值（从 texts 获取）
                bars.push({y1, y2, height: Math.round(height)});
            }
        }
        const texts = Array.from(heatSvg.querySelectorAll("text")).map(t => t.textContent);
        return JSON.stringify({count: bars.length, maxHeat: texts.filter(t => !isNaN(t)).map(t => parseInt(t)).pop() || 12, sample: bars.slice(0, 5)});
    })()
    """
    result = evaluate_js(js)
    if result.get("ok"):
        return json.loads(result["data"]["value"])
    return None

def extract_basic_stats():
    """提取基础数据卡片"""
    js = """
    (function(){
        const stats = {};
        const headings = document.querySelectorAll('h3, [role="heading"]');
        for (const h of headings) {
            const text = h.textContent.trim();
            const parent = h.parentElement;
            if (!parent) continue;
            const valueEl = parent.querySelector('p, [role="paragraph"]');
            if (valueEl) {
                const val = valueEl.textContent.trim();
                if (text.includes('播放') && !text.includes('昨日')) stats.plays = val;
                if (text.includes('点赞')) stats.likes = val;
                if (text.includes('收藏')) stats.bookmarks = val;
                if (text.includes('分享')) stats.shares = val;
                if (text.includes('完播率')) stats.completion_rate = val;
                if (text.includes('平均播放时长')) stats.avg_duration = val;
            }
        }
        return JSON.stringify(stats);
    })()
    """
    result = evaluate_js(js)
    if result.get("ok"):
        return json.loads(result["data"]["value"])
    return {}

def scrape_episode_detail(episode_title_hint=""):
    """
    抓取当前详情页的所有数据
    """
    print(f"🔍 抓取详情页: {episode_title_hint}")
    
    # 等待页面加载
    time.sleep(2)
    
    # 1. 基础数据
    basic = extract_basic_stats()
    print(f"  基础数据: {basic}")
    
    # 2. 留存趋势
    retention = extract_retention_data()
    if retention:
        print(f"  留存趋势: {retention['count']} 个点")
    else:
        print("  ⚠️  留存趋势提取失败")
    
    # 3. 互动热度
    heat = extract_interaction_heat()
    if heat:
        print(f"  互动热度: {heat['count']} 根柱子")
    else:
        print("  ⚠️  互动热度提取失败")
    
    return {
        "basic": basic,
        "retention": retention,
        "interaction_heat": heat,
        "scraped_at": datetime.now().isoformat()
    }

def scrape_all_episodes():
    """
    主流程：
    1. 打开主播后台内容管理页
    2. 获取所有单集列表
    3. 逐个点击详情，抓取数据
    4. 汇总写入 JSON/CSV
    """
    # 先导航到内容管理页
    result = navigate(DASHBOARD_URL)
    print(f"📍 导航结果: {result}")
    time.sleep(3)
    
    # 获取页面快照，找到所有"详情"链接
    snapshot = get_page_info()
    tree = snapshot.get("tree", [])
    
    # 从快照中提取单集列表和详情链接
    # 这个部分需要根据实际快照结构动态解析
    # 简化：先抓一集验证流程
    
    # 点击第一个"详情"链接
    # 注意：ref 需要根据实际快照获取
    print("⏳ 需要手动指定详情链接 ref，先抓一集测试...")
    
    # 测试抓 #009
    data = scrape_episode_detail("#009")
    
    # 保存结果
    output_path = f"/tmp/xiaoyuzhou_detail_009_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✅ 数据已保存: {output_path}")
    
    return data

if __name__ == "__main__":
    scrape_all_episodes()
