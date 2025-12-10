(() => {
	const TOKENS_PER_WORD = 1.2; // ~1.2 tokens per word (approx.)
	const DEFAULT_SPEED = 5; // tokens/sec
	const MAX_SPEED = 200;

	// Elements
	const speedInput = document.getElementById('speedInput');
	const speedSlider = document.getElementById('speedSlider');
	const tpsDisplay = document.getElementById('tpsDisplay');
	const elapsedDisplay = document.getElementById('elapsedDisplay');
	const wordsDisplay = document.getElementById('wordsDisplay');
	const tokensDisplay = document.getElementById('tokensDisplay');
	const toggleBtn = document.getElementById('toggleBtn');
	const resetBtn = document.getElementById('resetBtn');
	const copyBtn = document.getElementById('copyBtn');
	const clearBtn = document.getElementById('clearBtn');
	const outputBody = document.getElementById('outputBody');
	const outputText = document.getElementById('outputText');
	const canvas = document.getElementById('vizCanvas');
	const ctx = canvas.getContext('2d');

	// State
	let running = true;
	let speed = getInitialSpeed();
	let lastTime = performance.now();
	let elapsedMs = 0;
	let tokenAccumulator = 0;
	let tokenCount = 0; // integer tokens generated
	let wordAccumulator = 0; // fractional words derived from tokens

	// Output sample text
	const sampleText = (
		"Large Language Models generate output token by token. Visualizing this process helps developers tune latency expectations, set timeouts, and design responsive interfaces. " +
		"At higher token rates, content appears fluid and continuous; at lower rates, each fragment surfaces deliberately, shaping a distinct reading rhythm. " +
		"Use this demo to experiment with speeds and understand tradeoffs in UX. " +
		"Streaming responses can be chunked into small updates. Many frameworks support incremental rendering, so users perceive progress earlier. " +
		"Consider graceful fallbacks, retries, and cancellation controls in production apps. " +
		"Good defaults reduce friction; advanced users can customize to match their workloads. " +
		"Token counts vary by model and language, so treat these numbers as approximations. " +
		"Measure end-to-end latency in real scenarios, including network overhead and server load. " +
		"Finally, prioritize readability and clarity over raw speed when crafting user experiences."
	);
	const tokens = sampleText.split(/\s+/g).filter(Boolean);
	let tokenIndex = 0;

	// Particles
	const particles = [];

	function getInitialSpeed() {
		const params = new URLSearchParams(window.location.search);
		const s = parseFloat(params.get('speed'));
		if (!isNaN(s) && isFinite(s) && s >= 0) {
			return Math.min(s, MAX_SPEED);
		}
		return DEFAULT_SPEED;
	}

	function setCanvasSize() {
		const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
		const rect = canvas.getBoundingClientRect();
		canvas.width = Math.floor(rect.width * dpr);
		canvas.height = Math.floor(rect.height * dpr);
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	}

	function formatTime(ms) {
		const totalSeconds = Math.floor(ms / 1000);
		const hours = Math.floor(totalSeconds / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = totalSeconds % 60;
		if (hours > 0) {
			return `${hours}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
		}
		return `${minutes}:${String(seconds).padStart(2,'0')}`;
	}

	function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

	function updateUrlSpeedParam(value) {
		const url = new URL(window.location.href);
		url.searchParams.set('speed', String(value));
		history.replaceState({}, '', url);
	}

	function syncInputs(newSpeed) {
		speedInput.value = String(newSpeed);
		speedSlider.value = String(newSpeed);
		tpsDisplay.textContent = String(Number(newSpeed).toFixed(2));
	}

	function reset() {
		elapsedMs = 0;
		tokenAccumulator = 0;
		wordAccumulator = 0;
		tokenCount = 0;
		particles.length = 0;
		lastTime = performance.now();
		outputText.textContent = '';
		tokenIndex = 0;
		updateStatsUI();
		positionCaret();
	}

	function updateStatsUI() {
		elapsedDisplay.textContent = formatTime(elapsedMs);
		wordsDisplay.textContent = String(Math.floor(tokenCount / TOKENS_PER_WORD));
		tokensDisplay.textContent = String(tokenCount);
	}

	function spawnParticles(count) {
		// Visualize tokens as glowing particles moving left->right
		const rect = canvas.getBoundingClientRect();
		for (let i = 0; i < count; i++) {
			const y = Math.random() * rect.height;
			const size = 2 + Math.random() * 3;
			const speedPx = rect.width / (2.8 + Math.random() * 1.8); // complete cross in ~2.8-4.6s
			const hue = 200 + Math.random() * 80; // blue-purple range
			particles.push({
				x: -20,
				y,
				size,
				vx: speedPx,
				alpha: 0.12 + Math.random() * 0.2,
				hue,
				life: 0,
				maxLife: 4 + Math.random() * 2
			});
		}
	}

	function maybeAppendWords(fromTokensAdded) {
		// keep words in step with tokens to approximate TPS->WPS
		wordAccumulator += fromTokensAdded / TOKENS_PER_WORD;
		const wordsToAdd = Math.floor(wordAccumulator);
		if (wordsToAdd <= 0) return;
		wordAccumulator -= wordsToAdd;
		appendWords(wordsToAdd);
	}

	function appendWords(n) {
		let appended = '';
		for (let i = 0; i < n; i++) {
			const word = tokens[tokenIndex % tokens.length];
			appended += (outputText.textContent ? ' ' : '') + word;
			tokenIndex++;
		}
		if (appended) {
			outputText.textContent += appended;
			positionCaret();
			autoscroll();
		}
	}

	function positionCaret() {
		const caret = document.querySelector('.caret');
		if (!caret) return;
		// place caret at end of content; we approximate by placing it at padding-left + width of content line height
		// simpler: keep caret pinned to bottom-left after the text container using inline flow
		// Because caret is absolutely positioned within output-body, align to the end by measuring last line height
		const rect = outputBody.getBoundingClientRect();
		caret.style.left = `${Math.max(8, outputBody.scrollWidth - outputBody.clientWidth + 8)}px`;
		caret.style.top = `${rect.height - 24 + outputBody.scrollTop}px`;
	}

	function autoscroll() {
		// scroll to bottom while streaming
		outputBody.scrollTop = outputBody.scrollHeight;
	}

	function step(now) {
		const dt = now - lastTime;
		lastTime = now;

		if (running) {
			elapsedMs += dt;
			// accumulate tokens
			tokenAccumulator += (speed * dt) / 1000;
			if (tokenAccumulator >= 1) {
				const add = Math.floor(tokenAccumulator);
				tokenCount += add;
				tokenAccumulator -= add;
				// Spawn up to a capped number to keep perf sane
				spawnParticles(Math.min(add, 60));
				// Append text tied to tokens
				maybeAppendWords(add);
			}
		}

		draw(dt / 1000);
		updateStatsUI();
		requestAnimationFrame(step);
	}

	function draw(dt) {
		const rect = canvas.getBoundingClientRect();
		ctx.clearRect(0, 0, rect.width, rect.height);

		// Background subtle grid
		ctx.save();
		ctx.globalAlpha = 0.06;
		ctx.strokeStyle = '#ffffff';
		const grid = 28;
		for (let x = 0; x < rect.width; x += grid) {
			ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, rect.height); ctx.stroke();
		}
		for (let y = 0; y < rect.height; y += grid) {
			ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(rect.width, y); ctx.stroke();
		}
		ctx.restore();

		// Particles
		for (let i = particles.length - 1; i >= 0; i--) {
			const p = particles[i];
			p.x += p.vx * dt;
			p.life += dt;
			// fade in/out
			const lifeRatio = p.life / p.maxLife;
			let alpha = p.alpha;
			if (lifeRatio < 0.15) alpha *= lifeRatio / 0.15;
			if (lifeRatio > 0.85) alpha *= (1 - lifeRatio) / 0.15;

			// glow trail
			const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4);
			grad.addColorStop(0, `hsla(${p.hue}, 95%, 65%, ${alpha})`);
			grad.addColorStop(1, 'rgba(0,0,0,0)');
			ctx.fillStyle = grad;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2);
			ctx.fill();

			// core
			ctx.fillStyle = `hsla(${p.hue}, 95%, 65%, ${Math.min(1, alpha * 2)})`;
			ctx.beginPath();
			ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
			ctx.fill();

			// remove if off screen or exceeded life
			if (p.x > rect.width + 30 || p.life > p.maxLife) {
				particles.splice(i, 1);
			}
		}

		// Baseline indicator for current speed (subtle)
		ctx.save();
		ctx.globalAlpha = 0.4;
		ctx.fillStyle = 'rgba(255,255,255,0.06)';
		const strength = clamp(speed / MAX_SPEED, 0, 1);
		ctx.fillRect(0, rect.height - 6 - strength * (rect.height - 12), rect.width, 6);
		ctx.restore();
	}

	// Input bindings with enhanced UX
	speedInput.addEventListener('input', () => {
		const v = clamp(parseFloat(speedInput.value || '0'), 0, MAX_SPEED);
		speed = isNaN(v) ? 0 : v;
		syncInputs(speed);
		updateUrlSpeedParam(speed);
		// Add visual feedback
		speedInput.style.transform = 'scale(1.02)';
		setTimeout(() => { speedInput.style.transform = ''; }, 150);
	});
	
	speedSlider.addEventListener('input', () => {
		const v = clamp(parseFloat(speedSlider.value || '0'), 0, MAX_SPEED);
		speed = isNaN(v) ? 0 : v;
		syncInputs(speed);
		updateUrlSpeedParam(speed);
	});
	
	// Add smooth transitions for slider
	speedSlider.addEventListener('mousedown', () => {
		speedSlider.style.transition = 'none';
	});
	speedSlider.addEventListener('mouseup', () => {
		speedSlider.style.transition = 'all 0.2s ease';
	});

	toggleBtn.addEventListener('click', () => {
		running = !running;
		toggleBtn.textContent = running ? 'Pause' : 'Resume';
		toggleBtn.setAttribute('aria-pressed', String(running));
		lastTime = performance.now();
		
		// Add visual feedback
		toggleBtn.style.transform = 'scale(0.95)';
		setTimeout(() => { toggleBtn.style.transform = ''; }, 150);
	});
	
	resetBtn.addEventListener('click', () => {
		reset();
		// Add visual feedback
		resetBtn.style.transform = 'scale(0.95)';
		setTimeout(() => { resetBtn.style.transform = ''; }, 150);
	});
	
	copyBtn?.addEventListener('click', async () => {
		try {
			await navigator.clipboard.writeText(outputText.textContent || '');
			const originalText = copyBtn.textContent;
			copyBtn.textContent = '✓ Copied';
			copyBtn.style.background = 'linear-gradient(135deg, var(--ok), #059669)';
			copyBtn.style.color = 'white';
			setTimeout(() => { 
				copyBtn.textContent = originalText;
				copyBtn.style.background = '';
				copyBtn.style.color = '';
			}, 1500);
		} catch {
			copyBtn.textContent = '✗ Failed';
			setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1000);
		}
	});
	
	clearBtn?.addEventListener('click', () => {
		outputText.textContent = '';
		tokenIndex = 0;
		positionCaret();
		// Add visual feedback
		clearBtn.style.transform = 'scale(0.95)';
		setTimeout(() => { clearBtn.style.transform = ''; }, 150);
	});

	window.addEventListener('resize', () => { setCanvasSize(); positionCaret(); });
	window.addEventListener('keydown', (e) => {
		if (e.code === 'Space') { e.preventDefault(); toggleBtn.click(); }
		if (e.key.toLowerCase() === 'r') { reset(); }
	});

	// Initialize
	setCanvasSize();
	syncInputs(speed);
	updateStatsUI();
	positionCaret();
	requestAnimationFrame(step);
})();
