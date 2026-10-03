import { defineStore } from "pinia";
import { useProfileStore } from "@/stores/useProfileStore";
import { useHistoryStore } from "@/stores/useHistoryStore";

export const useGlobalStore = defineStore("global", () => {
  const profileStore = useProfileStore();
  const historyStore = useHistoryStore();

  const initializeStores = async () => {
    await profileStore.fetchProfile();
    await historyStore.fetchHistory();
  };

  return { initializeStores };
});
