import { v1 as uuidv1 } from "uuid"
import getStats from "./providers/GetStats.js"

export default function Manager({ statsManager, db }) {
	this.getProviders = getProviders
	this.addTask = addTask
	this.updateTask = updateTask
	this.execActiveTasks = execActiveTasks
	const providers = { getStats }

	async function getProviders() {
		return Object.keys(providers).reduce((model, key) => {
			const provider = providers[key]

			if (provider.name && provider.params) {
				model[key] = {
					name: provider.name,
					params: provider.params
				}
			}

			return model
		}, {})
	}

	async function addTask({ name, type, apiKey, apiSecret, itemIds, meta = {} }) {
		const _id = uuidv1()
		await db("tasks").insertOne({
			_id,
			name,
			type,
			apiKey,
			apiSecret,
			itemIds,
			status: "waiting",
			created: Date.now(),
			meta
		})
		return _id
	}

	async function updateTask(_id, fields) {
		await db("tasks").updateOne({ _id }, { $set: fields })
	}

	async function execActiveTasks() {
		const tasks = await db("tasks").find({ status: "waiting" }).toArray()
		const scope = { statsManager }

		const res = []

		for (let task of tasks) {
			let timerId
			try {
				timerId = setTimeout(() => {
					clearTimeout(timerId)
					throw new Error("1 minute passed and try block is not resolved")
				}, 60000)
				const ids = await providers[task.type].run({ ...scope, task })
				res.push(...ids)
				await updateTask(task._id, { status: "success" })
			} catch (e) {
				await updateTask(task._id, { status: "errored", error: e.message })
			} finally {
				clearTimeout(timerId)
			}
		}

		return res
	}
}
