export interface InventoryItem {
  appid: number;
  contextid: string;
  amount: string;
  assetid: string;
  classid: string;
  instanceid: string;
}


export interface InventoryItemForTrade {
  appid: number;
  contextid: string;
  amount: number;
  assetid: string;
  classid: string;
  instanceid: string;
}