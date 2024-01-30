import { handlers } from "../../handlers.js"
import { setupServer } from "msw/node"
import { expect } from "chai"

export default function Test({ StatsManager, db }) {
	const statsManager = new StatsManager({ db })

	it("Получить токен", async () => {
		const server = setupServer(...handlers)
		server.listen()

		const token = await statsManager.getToken({ apiKey: "testId", apiSecret: "testSecret" })
		expect(token).to.be.a("string")

		server.close()
	})

	it("Получить статистику звонков", async () => {
		const server = setupServer(...handlers)
		server.listen()

		const response = await statsManager.getCallsStats({
			token: "testToken",
			itemIds: [123456789, 987654321],
			dateFrom: "2024-01-01",
			dateTo: "2024-01-30"
		})
		expect(response).to.be.an("array")

		server.close()
	})

	it("Получить статистику постов", async function () {
		const server = setupServer(...handlers)
		server.listen()

		this.timeout(60000)

		const response = await statsManager.getPostsStats({
			token: "testToken",
			itemIds: [123456789, 987654321],
			dateFrom: "2024-01-01",
			dateTo: "2024-01-30"
		})
		expect(response).to.be.an("array")

		server.close()
	})

	it("Собрать статистику", async function () {
		const server = setupServer(...handlers)
		server.listen()

		this.timeout(60000)

		const ids = await statsManager.getStats({
			apiKey: "testApiKey",
			apiSecret: "testApiSecret",
			itemIds: [123456789, 987654321]
		})

		ids.forEach(async (_id) => {
			const stats = await db("stats").findOne({ _id })
			expect(stats).to.be.an("object")
			await db("stats").deleteOne({ _id })
		})

		server.close()
	})

	it("Собрать старую статистику", async function () {
		const server = setupServer(...handlers)
		server.listen()

		this.timeout(60000)

		const ids = await statsManager.getOldStats({
			apiKey: "testApiKey",
			apiSecret: "testApiSecret",
			itemIds: [123456789, 987654321]
		})

		ids.forEach(async (_id) => {
			const stats = await db("stats").findOne({ _id })
			expect(stats).to.be.an("object")
			await db("stats").deleteOne({ _id })
		})

		server.close()
	})
}
