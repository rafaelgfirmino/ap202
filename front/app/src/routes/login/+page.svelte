<script lang="ts">
	import { goto } from '$app/navigation';

	let email = $state('admin@ap202.com');
	let password = $state('123456');

	function handleLogin(event: SubmitEvent) {
		event.preventDefault();
		void goto('/sidebar-16');
	}
</script>

<svelte:head>
	<title>Login | Ap202</title>
</svelte:head>

<div id="login-page" class="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#eef4ff,transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-6">
	<div id="login-card" class="grid w-full max-w-6xl overflow-hidden rounded-[32px] border border-white/80 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.12)] lg:grid-cols-[0.95fr_1.05fr]">
		<section id="login-panel" class="px-8 py-10 lg:px-12">
			<div id="login-brand" class="flex items-center justify-center gap-3">
				<div
					id="login-brand-mark"
					class="flex h-20 w-[160px] items-center justify-center overflow-hidden rounded-[18px] border border-white/10 bg-black shadow-[0_10px_24px_rgba(15,23,42,0.18)]"
				>
					<img
						id="login-brand-mark-image"
						src="/media/app/logo.png"
						alt="Logo do Ap202"
						class="object-contain p-2"
					/>
				</div>
			</div>

			<div id="login-copy" class="mt-10 max-w-md">
				<h1 id="login-title" class="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#111827]">Entrar</h1>
			</div>

			<form id="login-form" class="mt-10 max-w-md space-y-5" onsubmit={handleLogin}>
				<label id="login-email-group" class="block">
					<span id="login-email-label" class="mb-2 block text-sm font-medium text-[#374151]">Email</span>
					<input id="login-email-input" bind:value={email} type="email" class="w-full rounded-full border border-[#dbe3ee] px-5 py-3.5 text-sm text-[#111827]" />
				</label>
				<label id="login-password-group" class="block">
					<span id="login-password-label" class="mb-2 block text-sm font-medium text-[#374151]">Password</span>
					<input id="login-password-input" bind:value={password} type="password" class="w-full rounded-full border border-[#dbe3ee] px-5 py-3.5 text-sm text-[#111827]" />
				</label>
				<button id="login-submit-button" type="submit" class="w-full rounded-full bg-[#111827] px-5 py-3.5 text-sm font-medium text-white">
					Entrar
				</button>
			</form>
		</section>

		<section id="login-preview" class="hidden bg-[linear-gradient(180deg,#f8fbff_0%,#eff4f9_100%)] p-8 lg:flex lg:flex-col lg:justify-center">
			<div id="login-preview-window" class="rounded-[28px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
				<div
					id="login-preview-shell"
					class="rounded-[24px] border border-[#eceef2] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)] p-4"
				>
					<div
						id="login-preview-sidebar"
						class="relative h-[420px] overflow-hidden rounded-[20px] border border-[#dbe3ee] bg-[linear-gradient(180deg,#f8fafc_0%,#eef2f7_100%)]"
					>
						<div id="login-preview-ground-line" class="absolute inset-x-6 bottom-[78px] h-[2px] bg-[#111827]"></div>

						<div id="login-preview-cloud-1" class="absolute left-[18px] top-[86px] h-4 w-10 rounded-full border border-[#111827] bg-white"></div>
						<div id="login-preview-cloud-2" class="absolute left-[154px] top-[26px] h-4 w-16 rounded-full border border-[#111827] bg-white"></div>
						<div id="login-preview-cloud-3" class="absolute right-[70px] top-[34px] h-4 w-14 rounded-full border border-[#111827] bg-white"></div>
						<div id="login-preview-cloud-4" class="absolute right-[18px] top-[110px] h-4 w-12 rounded-full border border-[#111827] bg-white"></div>

						<div id="login-preview-tree-left-1" class="absolute left-[26px] bottom-[84px] flex flex-col items-center">
							<div class="h-[64px] w-[26px] rounded-full border border-[#111827] bg-white"></div>
							<div class="h-[18px] w-[2px] bg-[#111827]"></div>
						</div>
						<div id="login-preview-tree-left-2" class="absolute left-[62px] bottom-[84px] flex flex-col items-center">
							<div class="h-[74px] w-[28px] rounded-full border border-[#111827] bg-[#111827]"></div>
							<div class="h-[18px] w-[2px] bg-[#111827]"></div>
						</div>
						<div id="login-preview-tree-right-1" class="absolute right-[34px] bottom-[84px] flex flex-col items-center">
							<div class="h-[74px] w-[28px] rounded-full border border-[#111827] bg-[#111827]"></div>
							<div class="h-[18px] w-[2px] bg-[#111827]"></div>
						</div>
						<div id="login-preview-tree-right-2" class="absolute right-[72px] bottom-[84px] flex flex-col items-center">
							<div class="h-[64px] w-[26px] rounded-full border border-[#111827] bg-white"></div>
							<div class="h-[18px] w-[2px] bg-[#111827]"></div>
						</div>

						<div
							id="login-preview-building-left"
							class="absolute left-[46px] bottom-[80px] h-[222px] w-[92px] border-2 border-[#111827] bg-white"
						>
							<div id="login-preview-building-left-roof" class="absolute inset-x-[-4px] top-[-8px] h-[8px] border-2 border-[#111827] bg-white"></div>
							<div id="login-preview-building-left-column" class="absolute left-[36px] top-0 h-full w-[20px] border-x-2 border-[#111827] bg-[#111827]"></div>
							<div id="login-preview-building-left-door" class="absolute bottom-0 left-[38px] h-[34px] w-[16px] border-x-2 border-t-2 border-[#111827] bg-white"></div>
							<div id="login-preview-building-left-floors" class="absolute inset-x-0 top-[24px] space-y-7">
								{#each Array(5) as _, index}
									<div id={`login-preview-building-left-floor-${index + 1}`} class="border-t-2 border-[#111827]">
										<div class="flex justify-between px-2 pt-2">
											<div class="h-[26px] w-[18px] border border-[#111827] bg-white"></div>
											<div class="h-[26px] w-[18px] border border-[#111827] bg-white"></div>
										</div>
									</div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-house-center"
							class="absolute left-1/2 bottom-[80px] h-[124px] w-[112px] -translate-x-1/2 border-2 border-[#111827] bg-white"
						>
							<div id="login-preview-house-center-roof" class="absolute left-[12px] top-[-34px] h-[34px] w-[88px] border-2 border-[#111827] bg-[#111827] [clip-path:polygon(50%_0%,100%_100%,0%_100%)]"></div>
							<div id="login-preview-house-center-door" class="absolute bottom-0 left-1/2 h-[34px] w-[18px] -translate-x-1/2 border-x-2 border-t-2 border-[#111827] bg-white"></div>
							<div id="login-preview-house-center-window-left" class="absolute left-[16px] top-[28px] h-[26px] w-[20px] border-2 border-[#111827] bg-white"></div>
							<div id="login-preview-house-center-window-right" class="absolute right-[16px] top-[28px] h-[26px] w-[20px] border-2 border-[#111827] bg-white"></div>
							<div id="login-preview-house-center-window-top-left" class="absolute left-[24px] top-[-22px] h-[18px] w-[16px] border-2 border-[#111827] bg-white"></div>
							<div id="login-preview-house-center-window-top-right" class="absolute right-[24px] top-[-22px] h-[18px] w-[16px] border-2 border-[#111827] bg-white"></div>
						</div>

						<div
							id="login-preview-building-right"
							class="absolute right-[46px] bottom-[80px] h-[202px] w-[124px] border-2 border-[#111827] bg-white"
						>
							<div id="login-preview-building-right-roof" class="absolute inset-x-[-6px] top-[-8px] h-[8px] border-2 border-[#111827] bg-white"></div>
							<div id="login-preview-building-right-core" class="absolute left-[42px] top-0 h-full w-[30px] border-x-2 border-[#111827] bg-white"></div>
							<div id="login-preview-building-right-floors" class="absolute inset-x-0 top-[18px] space-y-5">
								{#each Array(5) as _, index}
									<div id={`login-preview-building-right-floor-${index + 1}`} class="flex items-center justify-between border-t-2 border-[#111827] px-2 pt-2">
										<div class="h-[20px] w-[26px] border border-[#111827] bg-white"></div>
										<div class="h-[20px] w-[22px] border border-[#111827] bg-white"></div>
										<div class="h-[20px] w-[26px] border border-[#111827] bg-white"></div>
									</div>
								{/each}
							</div>
						</div>

						<div id="login-preview-bench" class="absolute left-[146px] bottom-[104px] h-[14px] w-[40px] rounded-[3px] border-2 border-[#111827] bg-white"></div>
						<div id="login-preview-canopy" class="absolute left-[138px] bottom-[120px] h-[14px] w-[54px] rounded-t-full border-2 border-[#111827] bg-white"></div>

						<div
							id="login-preview-car"
							class="absolute left-1/2 bottom-[48px] h-[34px] w-[74px] -translate-x-1/2 rounded-[14px] border-2 border-[#111827] bg-white"
						>
							<div id="login-preview-car-window" class="absolute left-[18px] top-[6px] h-[12px] w-[36px] rounded-t-[8px] border-2 border-[#111827] bg-[#111827]"></div>
							<div id="login-preview-car-wheel-left" class="absolute bottom-[-8px] left-[10px] size-[16px] rounded-full border-2 border-[#111827] bg-white"></div>
							<div id="login-preview-car-wheel-right" class="absolute bottom-[-8px] right-[10px] size-[16px] rounded-full border-2 border-[#111827] bg-white"></div>
						</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
