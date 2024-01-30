import { ClickHouse } from "clickhouse"
import config from "../../config.json" assert { type: "json" }

export default function Manager({ db }) {
	const clickhouse = new ClickHouse(config.clickhouse)

	this.exportToClickHouse = exportToClickHouse

	const tableName = "avito_stats"
	const chSchema = {
		ad_id: "TEXT",
		apiKey: "TEXT",
		itemId: "UInt64",
		// calls
		employeeId: "UInt64",
		answered: "UInt64",
		calls: "UInt64",
		newAnswered: "UInt64",
		newCalls: "UInt64",
		// posts
		uniqContacts: "UInt64",
		uniqFavorites: "UInt64",
		uniqViews: "UInt64",
		date: "TEXT"
	}

	async function exportToClickHouse(toExport) {
		const queries = [
			`DROP TABLE IF EXISTS ${tableName}`,

			`CREATE TABLE ${tableName} (
						${Object.keys(chSchema)
							.map((key) => `${key} ${chSchema[key]}`)
							.join(",\n")}
				)

				ENGINE = MergeTree
				PRIMARY KEY (ad_id);`
		]

		for (const query of queries) {
			const r = await clickhouse.query(query).toPromise()
		}

		const data = toExport || (await db("stats").find().sort({ date: -1, apiKey: 1, itemId: 1 }).toArray())

		await clickhouse.insert(`INSERT INTO ${tableName} (${Object.keys(chSchema).join(", ")})`, data).toPromise()
	}
}
