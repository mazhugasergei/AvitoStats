import { v1 as uuidv1 } from "uuid"

export default function Manager({ db }) {
	this.getToken = getToken
	this.getCallsStats = getCallsStats
	this.getPostsStats = getPostsStats
	this.getStats = getStats
	this.getOldStats = getOldStats

	async function getToken({ apiKey, apiSecret }) {
		const { access_token } = await fetch("https://api.avito.ru/token", {
			method: "POST",
			body: new URLSearchParams({
				client_id: apiKey,
				client_secret: apiSecret,
				grant_type: "client_credentials"
			})
		}).then((res) => res.json())
		return access_token
	}

	async function getUserId(token) {
		const response = await fetch("https://api.avito.ru/core/v1/accounts/self", {
			method: "GET",
			headers: {
				Authorization: `Bearer ${token}`
			}
		}).then((res) => res.json())
		if (response.code) throw new Error(response)
		return response.id
	}

	async function getCallsStats({ token, itemIds, dateFrom, dateTo }) {
		const userId = await getUserId(token)
		const response = await fetch(`https://api.avito.ru/core/v1/accounts/${userId}/calls/stats`, {
			method: "POST",
			headers: {
				Authorization: `Bearer ${token}`,
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				itemIds,
				dateFrom,
				dateTo
			})
		}).then((res) => res.json())
		if (response.code) throw new Error(response)
		return response.result.items
	}

	function chunkArray(array, chunkSize) {
		if (!array) return
		const res = []
		for (let i = 0; i < array.length; i += chunkSize) {
			const myChunk = array.slice(i, i + chunkSize)
			res.push(myChunk)
		}
		return res
	}

	async function getPostsStats({ token, itemIds, dateFrom, dateTo }) {
		const userId = await getUserId(token)

		const itemsIdsChunks = chunkArray(itemIds, 200) || [undefined]

		const items = await Promise.all(
			itemsIdsChunks.map(async (itemIds) => {
				const response = await fetch(`https://api.avito.ru/stats/v1/accounts/${userId}/items`, {
					method: "POST",
					headers: {
						Authorization: `Bearer ${token}`,
						"Content-Type": "application/json"
					},
					body: JSON.stringify({
						dateFrom,
						dateTo,
						fields: ["views"],
						itemIds,
						periodGrouping: "day"
					})
				}).then((res) => res.json())
				if (response.code) throw new Error(response)
				return response.result.items ?? []
			})
		)

		const flattenedItems = items.flat()

		return flattenedItems
	}

	function normalize(originalData) {
		return originalData.flatMap(({ apiKey, calls, posts, date, created }) => {
			return posts.map((post) => {
				const { new: newCalls, ...restCalls } = calls?.find((call) => call.itemId === post.itemId) || {
					itemId: 0,
					uniqContacts: 0,
					uniqFavorites: 0,
					uniqViews: 0,
					employeeId: 0,
					answered: 0,
					calls: 0,
					newAnswered: 0,
					newCalls: 0
				}
				const res = {
					apiKey,
					...post,
					newCalls,
					...restCalls,
					date,
					created
				}
				return res
			})
		})
	}

	async function getStats({ apiKey, apiSecret, itemIds, created = Date.now() }) {
		const date = new Date(created).toISOString().split("T")[0]

		const token = await getToken({ apiKey, apiSecret })

		const callsItems = await getCallsStats({ token, itemIds, dateFrom: date, dateTo: date })
		const calls = callsItems?.map((item) => {
			const { days, ...rest_1 } = item
			const { date, ...rest_2 } = days[0]
			return { ...rest_1, ...rest_2 }
		})

		const postsItems = await getPostsStats({ token, itemIds, dateFrom: date, dateTo: date })
		const posts = postsItems?.map((item) => {
			const { stats, ...rest_1 } = item
			const { date, ...rest_2 } = stats[0]
			return { ...rest_1, ...rest_2 }
		})

		const normalizedData = normalize([{ apiKey, calls, posts, date, created }])

		const ids = await Promise.all(
			normalizedData.map(async (obj) => {
				const _id = uuidv1()
				await db("stats").insertOne({ _id, ...obj })
				return _id
			})
		)
		return ids
	}

	async function getOldStats({ apiKey, apiSecret, itemIds, created = Date.now() }) {
		const _1day = 86400000
		const _270days = 23328000000

		const token = await getToken({ apiKey, apiSecret })

		const rawData = []

		// собрать все доступные в прошлом данные чанками по 270 дней
		for (let i = 0; ; i++) {
			const dateFrom = new Date(Date.now() - _270days - _270days * i).toISOString().split("T")[0]
			const dateTo = new Date(Date.now() - _1day - _270days * i).toISOString().split("T")[0]

			const oldCallsItems = await getCallsStats({ apiKey, token, itemIds, dateFrom, dateTo })
			if (!oldCallsItems) break
			const oldCalls = oldCallsItems.flatMap(({ days, ...rest_1 }) =>
				days.map(({ date, ...rest_2 }) => ({ ...rest_1, ...rest_2, date }))
			)
			const oldPostsItems = await getPostsStats({ apiKey, token, itemIds, dateFrom, dateTo })
			if (!oldPostsItems) break
			const oldPosts = oldPostsItems.flatMap(({ stats, ...rest_1 }) =>
				stats.map(({ date, ...rest_2 }) => ({ ...rest_1, ...rest_2, date }))
			)

			const input = { apiKey, calls: oldCalls, posts: oldPosts }

			const result = {}

			input.calls.forEach(({ date, ...restCall }) => {
				if (!result[date]) {
					result[date] = {
						apiKey,
						calls: [],
						posts: [],
						date,
						created
					}
				}
				result[date].calls.push(restCall)
			})

			input.posts.forEach(({ date, ...restPost }) => {
				if (!result[date]) {
					result[date] = {
						apiKey,
						calls: [],
						posts: [],
						date,
						created
					}
				}
				result[date].posts.push(restPost)
			})

			rawData.push(...Object.values(result))
		}

		const normalizedData = normalize(rawData)

		const ids = await Promise.all(
			normalizedData.map(async (obj) => {
				const { itemId, date } = obj
				const stats = await db("stats").findOne({ apiKey, itemId, date })
				// если запись существует - вернуть её _id
				if (stats) return stats._id
				// иначе заполнить пропуск
				const _id = uuidv1()
				await db("stats").insertOne({ _id, ...obj, apiKey, created })
				return _id
			})
		)

		return ids
	}
}
