export default function Manager() {
	const inprogress = {}

	this.addDaemon = addDaemon
	this.destroyDaemon = destroyDaemon

	async function addDaemon({ name, daemon, upTime = 1000 }) {
		try {
			await daemon()
		} catch (e) {
			console.log(e)
		}

		const intervalId = setInterval(async () => {
			try {
				if (!inprogress[name]) {
					inprogress[name] = true
					await daemon()
					inprogress[name] = false
				}
			} catch (e) {
				console.log(e)
				inprogress[name] = false
			}
		}, upTime)

		return intervalId
	}

	function destroyDaemon(intervalId) {
		clearInterval(intervalId)
	}
}
