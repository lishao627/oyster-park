/**
 * 城市配置模块
 *
 * 使用方式：
 * - 新增城市：直接在 cityList 数组追加一个对象即可
 * - 无需修改任何组件代码
 *
 * 字段说明：
 *   id       - 唯一标识（与 photo 文件夹名一致）
 *   name     - 城市名称
 *   folder   - 图片文件夹名称
 *   lat      - 纬度（WGS84）
 *   lng      - 经度（WGS84）
 *   date     - 旅行日期
 *   cover    - 封面图文件名（留空则取 photos[0]）
 *   photos   - 照片文件名数组
 *   unlocked - 是否已解锁
 *   journal  - 旅行手账：
 *     title   - 标题
 *     weather - 天气
 *     mood    - 心情 emoji
 *     content - 旅行心得
 */
export const cityList = [
  {
    id: "chengdu",
    name: "成都",
    folder: "chengdu",
    lat: 30.66,
    lng: 104.06,
    date: "2024.08",
    cover: "",
    photos: ["1.jpg", "2.jpg", "3.jpg"],
    unlocked: true,
    journal: {
      title: "第一次一个人旅行",
      weather: "晴",
      mood: "🧸",
      content: "第一次一个人坐高铁去那么远的地方。成都的慢节奏让我觉得很安心，在人民公园喝茶发呆了一整个下午。晚上在锦里逛的时候，听到路边卖唱的人在唱《成都》，突然觉得这座城市的温柔是具体而真实的。想在这里再多待几天。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "早上六点的高铁，天还没亮，窗外全是雾气。" },
      { stage: "到达", photo: "2.jpg", caption: "民宿藏在巷子深处，老板养了一只橘猫。" },
      { stage: "游玩", photo: "3.jpg", caption: "在人民公园喝茶发呆了一整个下午。" },
      { stage: "夜景", photo: "1.jpg", caption: "锦里灯笼亮起来，像走进一部旧电影。" },
      { stage: "回程", photo: "2.jpg", caption: "买了兔头带上车，结果一路没敢吃。" }
    ]
  },
  {
    id: "tianjin",
    name: "天津",
    folder: "tianjin",
    lat: 39.09,
    lng: 117.20,
    date: "2024.09",
    cover: "",
    photos: ["1.jpg", "2.jpg", "3.jpg"],
    unlocked: true,
    journal: {
      title: "五大道和煎饼果子",
      weather: "多云",
      mood: "☁️",
      content: "天津的租界建筑让人恍惚走在欧洲。五大道骑了一整天的自行车，每一栋小洋楼都像在讲故事。早餐吃了加两个蛋的煎饼果子，老板娘说「妹妹你再加根果子嘛」，太亲切了。海河边的夜景比想象中安静，坐着吹了好久的晚风。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "动车四十分钟，还没来得及睡就到站了。" },
      { stage: "到达", photo: "2.jpg", caption: "五大道的梧桐树把整条街罩进阴凉里。" },
      { stage: "游玩", photo: "3.jpg", caption: "骑了一整天共享单车，逛遍每一栋小洋楼。" },
      { stage: "夜景", photo: "1.jpg", caption: "海河边坐了很久，晚风比想象中安静。" },
      { stage: "回程", photo: "2.jpg", caption: "带了两份煎饼果子当晚饭，还是热的。" }
    ]
  },
  {
    id: "shenyang",
    name: "沈阳",
    folder: "shenyang",
    lat: 41.80,
    lng: 123.43,
    date: "2024.10",
    cover: "",
    photos: ["1.jpg", "2.jpg", "3.jpg", "4.jpg", "5.jpg", "6.jpg"],
    unlocked: true,
    journal: {
      title: "深秋的北陵公园",
      weather: "晴转多云",
      mood: "🍃",
      content: "十月的沈阳已经有了深秋的凉意。北陵公园的银杏叶铺了满地金黄，踩上去咔嚓咔嚓的。故宫比北京的小很多，但有一种质朴的可爱。晚上去吃了鸡架和烤冷面，这座城市的粗犷里藏着一种让人安心的烟火气。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "十月的清晨，风已经有点凉。" },
      { stage: "到达", photo: "2.jpg", caption: "北陵公园的银杏落了满地金黄。" },
      { stage: "游玩", photo: "3.jpg", caption: "故宫比想象中小，却有质朴的可爱。" },
      { stage: "夜景", photo: "4.jpg", caption: "鸡架配烤冷面，满街都是烟火气。" },
      { stage: "回程", photo: "5.jpg", caption: "口袋里还装着公园里捡的银杏叶。" }
    ]
  },
  {
    id: "dalian",
    name: "大连",
    folder: "dalian",
    lat: 38.91,
    lng: 121.61,
    date: "2024.11",
    cover: "",
    photos: ["1.jpg", "2.jpg", "3.jpg", "4.jpg"],
    unlocked: true,
    journal: {
      title: "海风的味道",
      weather: "晴",
      mood: "🌙",
      content: "大连的海和南方的海不一样，是清冷而辽阔的。坐在渔人码头的堤坝上看夕阳慢慢沉进海里，整个世界变成了温柔的橘色。有轨电车哐当哐当穿过城市，像在时间里旅行。星海广场的夜风吹得人想哭，是那种被美到的想哭。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "海风从进站口就开始迎面吹。" },
      { stage: "到达", photo: "2.jpg", caption: "有轨电车哐当哐当穿过城市。" },
      { stage: "游玩", photo: "3.jpg", caption: "在渔人码头看夕阳慢慢沉进海里。" },
      { stage: "夜景", photo: "4.jpg", caption: "星海广场的夜风，吹得人想唱歌。" },
      { stage: "回程", photo: "1.jpg", caption: "带了一罐海盐，说是这里的味道。" }
    ]
  },
  {
    id: "huhehaote",
    name: "呼和浩特",
    folder: "huhehaote",
    lat: 40.84,
    lng: 111.75,
    date: "2024.12",
    cover: "",
    photos: ["1.jpg", "2.jpg", "3.jpg"],
    unlocked: true,
    journal: {
      title: "草原的冬天",
      weather: "小雪",
      mood: "✈️",
      content: "冬天的草原是另一种美——苍茫、寂静、无边无际。在蒙古包里喝了热腾腾的奶茶，听主人讲草原上星星的名字。晚上的星空是我见过最清澈的，银河清晰得像一条发光的河。零下二十度的空气吸进肺里，整个人都清醒了。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "从车窗望出去，城市一点点消失。" },
      { stage: "到达", photo: "2.jpg", caption: "冬天的草原苍茫安静，无边无际。" },
      { stage: "游玩", photo: "3.jpg", caption: "在蒙古包里喝了热腾腾的奶茶。" },
      { stage: "夜景", photo: "1.jpg", caption: "零下二十度的星空，银河像一条发光的河。" },
      { stage: "回程", photo: "2.jpg", caption: "吸了一口冷空气，整个人都清醒了。" }
    ]
  },
  {
    id: "qinghuangdao",
    name: "秦皇岛",
    folder: "qinghuangdao",
    lat: 39.93,
    lng: 119.59,
    date: "2025.01",
    cover: "",
    photos: ["1.jpg"],
    unlocked: true,
    journal: {
      title: "阿那亚的冬日海",
      weather: "阴",
      mood: "📷",
      content: "冬天的阿那亚几乎没什么游客。孤独图书馆里只有海浪声和翻书声。在海边走了很久，灰色的海和灰色的天空连成一片，分不清界限。有时候觉得孤独也是一种完整的体验。这座海边礼堂站在那里，像在等一个永远不会来的人。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "冬天来看海，路上几乎没人。" },
      { stage: "到达", photo: "1.jpg", caption: "孤独图书馆里只有海浪声和翻书声。" },
      { stage: "游玩", photo: "1.jpg", caption: "沿着海岸走了很久，灰蓝连成一片。" },
      { stage: "夜景", photo: "1.jpg", caption: "天暗下来，海变成一整块深色玻璃。" },
      { stage: "回程", photo: "1.jpg", caption: "礼堂还在身后，像在等一个人。" }
    ]
  },
  {
    id: "guiyang",
    name: "贵阳",
    folder: "guiyang",
    lat: 26.65,
    lng: 106.63,
    date: "2025.03",
    cover: "",
    photos: ["1.jpg", "2.jpg"],
    unlocked: true,
    journal: {
      title: "山里有座城",
      weather: "小雨",
      mood: "🌿",
      content: "贵阳是一座被山包围的城市。甲秀楼的夜色倒映在南明河上，像一幅水墨画。黔灵山的猴子比人还自在，抢了我的面包还朝我翻白眼（笑）。酸汤鱼是真的好吃，那个酸味到现在想起来还会流口水。下次想夏天来避暑。"
    },
    timeline: [
      { stage: "出发", photo: "1.jpg", caption: "火车钻过一个又一个山洞，往山里走。" },
      { stage: "到达", photo: "2.jpg", caption: "整座城被山围着，灯火倒映在河里。" },
      { stage: "游玩", photo: "1.jpg", caption: "黔灵山的猴子抢了面包，还朝我翻白眼。" },
      { stage: "夜景", photo: "2.jpg", caption: "甲秀楼亮灯，南明河像一幅水墨画。" },
      { stage: "回程", photo: "1.jpg", caption: "酸汤鱼的酸味，一直惦记到现在。" }
    ]
  }
]

export function unlockCity(cityName) {
  const city = cityList.find(c => c.name === cityName)
  if (city && !city.unlocked) {
    city.unlocked = true
    return true
  }
  return false
}

export function unlockCities(names) {
  return names.map(unlockCity).filter(Boolean).length
}

export function getUnlockedCities() {
  return cityList.filter(c => c.unlocked)
}

export function getAllCities() {
  return cityList
}

export function getCityById(id) {
  return cityList.find(c => c.id === id)
}
