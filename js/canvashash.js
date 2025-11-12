//Canvas Fingerprint
const canvas = document.createElement('canvas'); 
const ctx = canvas.getContext('2d'); 
ctx.fillText('hello', 10, 10); 
const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
let pixelString = '';
for (let i = 0; i < imageData.length; i++) {
	pixelString += String.fromCharCode(imageData[i]);
const audio = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
const hash = btoa(pixelString);
console.log('Fingerprint:', hash);

const canvasHash = hash; // Assign canvas fingerprint hash

//Audio Context Fingerprint
const audio = new AudioContext();
const osc = audio.createOscillator();
osc.frequency.value = 440;
osc.connect(audio.destination);
osc.start(0);

let audioHash = '';
audio.oncomplete = function() {
	// This is a placeholder; in practice, you'd process audio data for a real hash
	audioHash = 'audio-fingerprint-placeholder';
	storeAndSend();
};
	localStorage.setItem('ghost', btoa(fp.join('|')));
	fetch('https://enos.itcollege.ee/kachan/ghost', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({ ghost: localStorage.ghost })
	});
	localStorage.setItem('ghost', btoa(fp.join('|')));
	fetch('https://enos.itcollege.ee/kachan/ghost', {method: 'POST', body: localStorage.ghost});
}
let fp = [canvasHash, audioHash, navigator.userAgent, new Date().getTimezoneOffset()];
localStorage.setItem('ghost', btoa(fp.join('|')));
fetch('https://enos.itcollege.ee/kachan/ghost', {
	method: 'POST',
	headers: {
		'Content-Type': 'application/json'
	},
	body: JSON.stringify({ ghost: localStorage.ghost })
});
	for (let i = 0; i < output.length; i++) {
		hash = ((hash << 5) - hash) + Math.floor(output[i] * 1000);
		hash |= 0;
	}
	const audioHash = btoa(hash.toString());
	const canvasHash = btoa(canvas.toDataURL());
	let fp = [canvasHash, audioHash, navigator.userAgent, new Date().getTimezoneOffset()];
	localStorage.setItem('ghost', btoa(fp.join('|')));
	fetch('https://enos.itcollege.ee/kachan/ghost', {method: 'POST', body: localStorage.ghost});
});
osc.frequency.value = 440

let fp = [canvasHash, audioHash, navigator.userAgent, new Date().getTimezoneOffset()];
localStorage.setItem('ghost', btoa(fp.join('|')));
fetch('https://enos.itcollege.ee/kachan/ghost', {method: 'POST', body: localStorage.ghost})
