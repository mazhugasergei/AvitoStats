import Horizen from "horizen-framework/backend"
import config from "../../config.json" assert { type: "json" }
import cron from "node-cron"

const horizen = new Horizen(config.horizen)

export default horizen.init(async function (props, options) {
	const { localServices, controllers } = props
	const deps = { ...props, config }

	const daemonsManager = new localServices.DaemonsManager({ ...props })
	const exportManager = new localServices.ExportManager({ ...props })
	const statsManager = new localServices.StatsManager({ ...props })
	const tasksManager = new localServices.TasksManager({ statsManager, ...props })
	const cronManager = new localServices.CronManager({ tasksManager, ...props })

	const accountsKeys = Object.keys(config.accounts)

	// get old stats
	console.log("Collecting old stats...")
	for (let key of accountsKeys) {
		const { apiKey, apiSecret } = config.accounts[key]
		try {
			const ids = await statsManager.getOldStats({ apiKey, apiSecret })
		} catch (e) {
			console.error("\x1b[31m[Error collecting old stats]\x1b[0m", e)
		}
	}
	console.log("Collected")

	// add tasks daemon
	daemonsManager.addDaemon({ name: "execActiveTasks", daemon: tasksManager.execActiveTasks })

	// collect stats every day at 23:00
	for (let key of accountsKeys) {
		const { apiKey, apiSecret } = config.accounts[key]
		cronManager.getStats({ _id: key, name: key, cron: "0 23 * * *", apiKey, apiSecret })
	}

	// add export cron
	cronManager.exportToClickHouse({ _id: "0", cron: "30 23 * * *" })

	return {
		port: config.horizen.ports.server,

		controllers: {
			post: [controllers.getStats({ ...deps })],
			get: []
		}
	}
})
