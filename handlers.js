import { http, HttpResponse } from "msw"

export const handlers = [
	// token
	http.post("https://api.avito.ru/token", () => {
		return HttpResponse.json({
			access_token: "kChqt9ewQNAcwgbHp4yFd5",
			expires_in: 3600,
			token_type: "Bearer"
		})
	}),

	// user info
	http.get(`https://api.avito.ru/core/v1/accounts/self`, async () => {
		return HttpResponse.json({
			id: 289744947,
			name: "Анастасия",
			phone: "796522560445",
			profile_url: "https://www.avito.ru/user/b6f3fd499eb1a3f5d3f97a497c239c8a/profile",
			email: "example@gmail.com"
		})
	}),

	// calls
	http.post(`https://api.avito.ru/core/v1/accounts/:userId/calls/stats`, async ({ request }) => {
		const req = await request.json()
		let dateFrom = new Date(req.dateFrom).getTime()
		const dateTo = new Date(req.dateTo).getTime()
		const dates = [new Date(dateFrom).toISOString().split("T")[0]]
		while (dateFrom !== dateTo) {
			dateFrom += 86400000
			dates.push(new Date(dateFrom).toISOString().split("T")[0])
		}
		return HttpResponse.json({
			result:
				req.dateFrom > "2020-01-01"
					? {
							items: req.itemIds.map((itemId) => ({
								itemId,
								employeeId: 0,
								days: dates.map((date) => ({
									answered: Math.floor(Math.random() * 64) + 60,
									calls: Math.floor(Math.random() * 112) + 123,
									new: Math.floor(Math.random() * 235),
									newAnswered: Math.floor(Math.random() * 124),
									date
								}))
							}))
					  }
					: {}
		})
	}),

	// posts
	http.post("https://api.avito.ru/stats/v1/accounts/:userId/items", async ({ request }) => {
		const req = await request.json()
		let dateFrom = new Date(req.dateFrom).getTime()
		const dateTo = new Date(req.dateTo).getTime()
		const dates = [new Date(dateFrom).toISOString().split("T")[0]]
		while (dateFrom !== dateTo) {
			dateFrom += 86400000
			dates.push(new Date(dateFrom).toISOString().split("T")[0])
		}
		return HttpResponse.json({
			result:
				req.dateFrom > "2020-01-01"
					? {
							items: req.itemIds.map((itemId) => ({
								itemId,
								stats: dates.map((date) => ({
									date,
									uniqContacts: Math.floor(Math.random() * 2) + 1,
									uniqFavorites: 0,
									uniqViews: Math.floor(Math.random() * 6) + 5
								}))
							}))
					  }
					: {}
		})
	})
]
