export default {
	run: async ({ statsManager, task }) => {
		const { apiKey, apiSecret, itemIds, created } = task
		return await statsManager.getStats({ apiKey, apiSecret, itemIds, created })
	}
}
