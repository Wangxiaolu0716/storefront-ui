/* Storefront UI · 虚构示例数据（不含任何真实厂商/应用信息）
 * 换成你自己的接口返回，只要字段一致即可。 */
window.SF_DATA = (function () {
  /** @typedef {{id:string,name:string,sub:string,c1:string,c2:string,letter:string,category:string,rating:number,sizeMB:number,rank:number}} App */

  /** @type {App[]} */
  const apps = [
    { id: 'a01', name: '像素笔记',   sub: '手写、OCR 与双链',   c1: '#6a5bf0', c2: '#9d6bff', letter: 'P', category: '效率', rating: 4.8, sizeMB: 42,  rank: 1 },
    { id: 'a02', name: '潮汐清单',   sub: '按精力排序的待办',   c1: '#0fb6a8', c2: '#3ddc97', letter: 'T', category: '效率', rating: 4.7, sizeMB: 28,  rank: 2 },
    { id: 'a03', name: '格子相册',   sub: '本地 AI 相册整理',   c1: '#ff7a59', c2: '#ffb057', letter: 'G', category: '摄影', rating: 4.6, sizeMB: 96,  rank: 3 },
    { id: 'a04', name: '山径',       sub: '徒步路线与海拔图',   c1: '#2f9e6b', c2: '#8bd17c', letter: 'S', category: '出行', rating: 4.9, sizeMB: 118, rank: 4 },
    { id: 'a05', name: '听风 FM',    sub: '白噪音与电台',       c1: '#3b82f6', c2: '#8fb8ff', letter: 'F', category: '音乐', rating: 4.5, sizeMB: 64,  rank: 5 },
    { id: 'a06', name: '碎碎账',     sub: '三秒记一笔',         c1: '#f4b400', c2: '#ffd76e', letter: 'Z', category: '财务', rating: 4.4, sizeMB: 31,  rank: 6 },
    { id: 'a07', name: '墨鱼词典',   sub: '离线词库 + 例句',    c1: '#8b5cf6', c2: '#c4b5fd', letter: 'M', category: '教育', rating: 4.7, sizeMB: 210, rank: 7 },
    { id: 'a08', name: '画格子',     sub: '格子画与配色卡',     c1: '#ec4899', c2: '#ffa8d2', letter: 'H', category: '设计', rating: 4.6, sizeMB: 55,  rank: 8 },
    { id: 'a09', name: '慢跑圈',     sub: '配速与心率区间',     c1: '#ef4444', c2: '#ff9a8b', letter: 'R', category: '健康', rating: 4.8, sizeMB: 87,  rank: 9 },
    { id: 'a10', name: '汤勺食谱',   sub: '十五分钟家常菜',     c1: '#f97316', c2: '#ffc27a', letter: 'C', category: '生活', rating: 4.5, sizeMB: 73,  rank: 10 },
    { id: 'a11', name: '拼图星球',   sub: '每日一图 · 无内购',  c1: '#06b6d4', c2: '#7dd3fc', letter: 'J', category: '游戏', rating: 4.9, sizeMB: 145, rank: 11 },
    { id: 'a12', name: '夜航船',     sub: '天文观测与星图',     c1: '#1e3a8a', c2: '#4c6ef5', letter: 'Y', category: '教育', rating: 4.7, sizeMB: 132, rank: 12 },
    { id: 'a13', name: '木纹日历',   sub: '模板日程与周视图',   c1: '#a16207', c2: '#e0b375', letter: 'R', category: '效率', rating: 4.3, sizeMB: 24,  rank: 13 },
    { id: 'a14', name: '小满天气',   sub: '分钟级降雨提醒',     c1: '#0284c7', c2: '#67d4ff', letter: 'W', category: '出行', rating: 4.6, sizeMB: 38,  rank: 14 }
  ];

  /** 首页大卡（编辑推荐位） */
  const promo = {
    tag: '编辑推荐',
    title: '本周精选：把工具做得安静一点',
    desc: '6 款低打扰的效率应用，全部支持离线。',
    cta: '查看合集',
    c1: '#5b54e8',
    c2: '#a86bff',
    covers: ['#6a5bf0', '#0fb6a8', '#ff7a59']
  };

  const chips = ['效率', '摄影', '出行', '音乐', '教育', '游戏', '设计', '健康'];

  const hotWords = ['像素笔记', '白噪音', '离线词典', '记账', '跑步', '星图'];

  return { apps, promo, chips, hotWords };
})();
