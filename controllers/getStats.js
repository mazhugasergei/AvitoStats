export default function ({ db }) {
	return {
		endpoint: "/api/getStats",
		auth: "bypass",
		description: "",
		errors: {},

		reqSchema: ({ string, object, array, number, any }, {}) => ({
			dateFrom: string(/.{1,10}/).optional(),
			dateTo: string(/.{1,10}/).optional(),
			apiKey: string(/.{1,100}/).optional(),
			itemId: string(/.{1,100}/).optional()
		}),

		resSchema: ({ string, object, array, number, any }, {}) => ({
			stats: array(
				object({
					_id: string(/.{1,100}/),
					apiKey: string(/.{1,100}/),
					itemId: number(/.{1,100}/),
					employeeId: number(/.{1,100}/),
					answered: number(/.{1,100}/),
					calls: number(/.{1,100}/),
					newAnswered: number(/.{1,100}/),
					newCalls: number(/.{1,100}/),
					uniqContacts: number(/.{1,100}/),
					uniqFavorites: number(/.{1,100}/),
					uniqViews: number(/.{1,100}/),
					date: string(/.{1,10}/),
					created: number(/.{1,100}/)
				})
			)
		}),

		controller: async function ({ body, auth, req, res }) {
			const { dateFrom, dateTo, apiKey, itemId } = body
			const stats = await db("stats")
				.find({ apiKey, itemId, date: { $gte: dateFrom, $lte: dateTo } })
				.sort({ date: -1, apiKey: 1, itemId: 1 })
				.toArray()
			return { stats }
		}
	}
}
