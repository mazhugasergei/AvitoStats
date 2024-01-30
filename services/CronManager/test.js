import { expect } from "chai"
import { v1 as uuidv1 } from "uuid"

export default function Test({ StatsManager, TasksManager, CronManager, db }) {
	const statsManager = new StatsManager({ db })
	const tasksManager = new TasksManager({ statsManager, db })
	const cronManager = new CronManager({ tasksManager })

	it("Создать работу", async () => {
		const _id = uuidv1()
		cronManager.getStats({ _id, name: "testName", cron: "*/30 * * * *" })
		expect(cronManager.jobs).to.have.key(_id)
		cronManager.deleteJob(_id)
	})

	it("Удалить работу", async () => {
		const _id = uuidv1()
		cronManager.getStats({ _id, name: "testName", cron: "*/30 * * * *" })
		cronManager.deleteJob(_id)
		expect(cronManager.jobs).not.have.key(_id)
	})
}
