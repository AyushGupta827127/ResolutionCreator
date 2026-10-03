import { defineStore } from "pinia";
import { ref } from "vue";
import { useProfileStore } from "@/stores/useProfileStore";

export const useHistoryStore = defineStore("history", () => {
  const items = ref([]);
  const loading = ref(false);

  const fetchHistory = async () => {
    const profileStore = useProfileStore();
    if (!profileStore.profile.id) return;
    loading.value = true;
    try {
      const res = await fetch(
        `https://temp.finaceindia.com/items/history?filter[user_id][_eq]=${profileStore.profile.id}&filter[template_name][_starts_with]=Resolution:&sort=-date_created`
      );
      const json = await res.json();
      items.value = json.data || [];
    } catch (error) {
      console.error("Error fetching resolution history:", error);
    } finally {
      loading.value = false;
    }
  };

  return { items, loading, fetchHistory };
});
