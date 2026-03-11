import type { Category } from "@/types";

export const initialCategories: Category[] = [
  // 大分类
  { id: "cat-dog", name: "狗粮", icon: "dog", parentId: null, sortOrder: 1 },
  { id: "cat-restaurant", name: "餐厅美食", icon: "utensils-crossed", parentId: null, sortOrder: 2 },
  { id: "cat-snack", name: "零食", icon: "candy", parentId: null, sortOrder: 3 },
  { id: "cat-drink", name: "饮品", icon: "cup-soda", parentId: null, sortOrder: 4 },
  { id: "cat-wanttry", name: "想尝试", icon: "sparkles", parentId: null, sortOrder: 5 },

  // 狗粮子分类
  { id: "sub-dog-can", name: "狗罐", icon: "package", parentId: "cat-dog", sortOrder: 1 },
  { id: "sub-dog-fresh", name: "狗鲜食", icon: "beef", parentId: "cat-dog", sortOrder: 2 },

  // 餐厅按地区子分类
  { id: "sub-res-general", name: "通用", icon: "map-pin", parentId: "cat-restaurant", sortOrder: 1 },
  { id: "sub-res-xuhui", name: "徐汇", icon: "map-pin", parentId: "cat-restaurant", sortOrder: 2 },
  { id: "sub-res-caohejing", name: "漕河泾", icon: "map-pin", parentId: "cat-restaurant", sortOrder: 3 },
  { id: "sub-res-jingan", name: "静安", icon: "map-pin", parentId: "cat-restaurant", sortOrder: 4 },
  { id: "sub-res-lingang", name: "临港", icon: "map-pin", parentId: "cat-restaurant", sortOrder: 5 },
  { id: "sub-res-guangzhou", name: "广州", icon: "map-pin", parentId: "cat-restaurant", sortOrder: 6 },
];
