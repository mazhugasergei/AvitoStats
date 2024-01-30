import * as Cron from "node-cron"

export default function Manager({ tasksManager, db }) {
	const jobs = {}

	this.jobs = jobs
	this.getStats = getStats
	this.exportToClickHouse = exportToClickHouse
	this.deleteJob = deleteJob

	function getStats({ _id, name, cron, apiKey, apiSecret }) {
		jobs[_id] = Cron.schedule(cron, async () => {
			await tasksManager.addTask({ name, type: "getStats", apiKey, apiSecret })
		})
	}

	function exportToClickHouse({ _id, cron }) {
		jobs[_id] = Cron.schedule(cron, async () => {
			const toExport = await db("stats").find().toArray()
			await exportManager.exportToClickHouse(toExport)
		})
	}

	async function deleteJob(_id) {
		jobs[_id].stop()
		delete jobs[_id]
	}
}
