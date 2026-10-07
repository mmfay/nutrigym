// NutriGym service worker: reminder pushes (workout + meal check-ins) + home screen icon badge.
// Payload shape matches PushPayload in src/lib/dataTypes.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

function setBadge(count) {
	const nav = self.navigator;
	if (!nav || !("setAppBadge" in nav)) return Promise.resolve();
	return (count > 0 ? nav.setAppBadge(count) : nav.clearAppBadge()).catch(() => undefined);
}

self.addEventListener("push", (event) => {

	let data = {};
	try {
		data = event.data ? event.data.json() : {};
	} catch {
		data = { body: event.data ? event.data.text() : "" };
	}

	const work = [
		// iOS revokes push for apps that receive a push without showing a notification
		self.registration.showNotification(data.title || "NutriGym", {
			body: data.body || "",
			icon: "/apple-icon.png",
			tag: data.tag || "nutrigym",
			data: { url: data.url || "/home" },
		}),
	];

	// only workout reminders carry a badge count; meal check-ins leave the badge as is
	if (typeof data.badge === "number") work.push(setBadge(data.badge));

	event.waitUntil(Promise.all(work));

});

self.addEventListener("notificationclick", (event) => {

	event.notification.close();

	const url = new URL(event.notification.data?.url || "/home", self.location.origin).href;

	event.waitUntil(
		self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
			for (const client of clients) {
				if (client.url.startsWith(self.location.origin) && "focus" in client) {
					return client.focus().then((c) => ("navigate" in c ? c.navigate(url) : c));
				}
			}
			return self.clients.openWindow(url);
		})
	);

});