import { expect } from "chai"
import { handlers } from "../../handlers.js"
import { setupServer } from "msw/node"

export default Test

function Test({ StatsManager, TasksManager, db }) {
	const statsManager = new StatsManager({ db })
	const tasksManager = new TasksManager({ statsManager, db })

	it("Получить список всех доступных провайдеров", async () => {
		const providers = await tasksManager.getProviders()
		expect(providers).to.be.an("object")
	})

	it("Создать таск", async () => {
		const _id = await tasksManager.addTask({ name: "testName" })
		const tasks = await db("tasks").findOne({ _id })
		expect(tasks.name).to.equal("testName")
		expect(tasks.status).to.equal("waiting")
		await db("tasks").deleteOne({ _id })
	})

	it("Редактировать таск", async () => {
		const _id = await tasksManager.addTask({ name: "testNameeeeeeeee" })
		await tasksManager.updateTask(_id, { name: "testName" })
		const tasks = await db("tasks").findOne({ _id })
		expect(tasks.name).to.equal("testName")
		await db("tasks").deleteOne({ _id })
	})

	it("Выполнение тасков (с ошибкой)", async () => {
		const _id = await tasksManager.addTask({ type: "nonexistentTaskType" })
		await tasksManager.execActiveTasks()
		const tasks = await db("tasks").findOne({ _id })
		expect(tasks.status).to.equal("errored")
		await db("tasks").deleteOne({ _id })
	})

	describe("Провайдер GetStats", () => {
		it("Получить статистику за день", async () => {
			const server = setupServer(...handlers)
			server.listen()

			const _id = await tasksManager.addTask({
				name: "testName",
				type: "getStats",
				apiKey: "testApiKey",
				itemIds: [123456789, 987654321],
				userSecret: "testSecret"
			})
			const ids = await tasksManager.execActiveTasks()

			const task = await db("tasks").findOne({ _id })
			expect(task.status).to.equal("success")
			await db("tasks").deleteOne({ _id })
			const res = await db("stats").deleteMany({ _id: { $in: ids } })

			server.close()
		})
	})
}
