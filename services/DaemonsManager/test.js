import { expect } from "chai"

export default function Test({ DaemonsManager }) {
	const daemonsManager = new DaemonsManager()

	function wait(time) {
		return new Promise((resolve) => {
			setTimeout(resolve, time)
		})
	}

	it(`Базовая проверка работоспособности`, async () => {
		let test = 0
		const id = await daemonsManager.addDaemon({
			name: "testName",
			daemon: () => (test += 1),
			upTime: 100
		})

		expect(test).to.be.equal(1)
		await wait(200)

		expect(test).to.be.equal(2)

		daemonsManager.destroyDaemon(id)
		await wait(200)

		expect(test).to.be.equal(2)
	})
}
