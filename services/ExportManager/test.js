export default function Test({ ExportManager, db, config }) {
	const exportManager = new ExportManager({ db })

	it("Проверка экспорта", async () => {
		const toExport = [
			{
				_id: "0",
				apiKey: "testId",
				itemId: 123456789,
				employeeId: 0,
				answered: 70,
				calls: 192,
				newAnswered: 78,
				newCalls: 223,
				uniqContacts: 1,
				uniqFavorites: 0,
				uniqViews: 8,
				date: "2024-01-27"
			},
			{
				_id: "1",
				apiKey: "testId",
				itemId: 987654321,
				employeeId: 0,
				answered: 65,
				calls: 170,
				newAnswered: 11,
				newCalls: 79,
				uniqContacts: 2,
				uniqFavorites: 0,
				uniqViews: 7,
				date: "2024-01-27"
			}
		]

		await exportManager.exportToClickHouse(toExport)
	})
}
