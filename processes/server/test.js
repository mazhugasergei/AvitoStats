import { expect } from "chai"

export default function Test({ config }) {
	const url = `http://127.0.0.1:${config.horizen.ports.server}`

	describe("Проверка бизнес-цепочки", function () {
		it("Получить статистику", async () => {
			const response = await fetch(`${url}/api/getStats`, {
				method: "POST",
				headers: { "Content-Type": "application/json" }
			}).then((res) => res.json())
			const { stats } = response.result
			expect(stats).to.be.an("array")
		})
	})
}
