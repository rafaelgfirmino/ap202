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
			<div id="login-brand" class="flex items-center gap-3">
				<div id="login-brand-mark" class="flex size-12 items-center justify-center rounded-2xl bg-[#111827] text-lg font-semibold text-white">A</div>
				<div id="login-brand-text">
					<div id="login-brand-name" class="text-2xl font-semibold tracking-[-0.04em] text-[#111827]">Ap202</div>
					<div id="login-brand-tagline" class="text-sm text-[#6b7280]">Condomínio digital sem burocracia</div>
				</div>
			</div>

			<div id="login-copy" class="mt-14 max-w-md">
				<div id="login-kicker" class="inline-flex rounded-full bg-[#eff6ff] px-3 py-1 text-sm font-medium text-[#2563eb]">Self service</div>
				<h1 id="login-title" class="mt-5 text-5xl font-semibold tracking-[-0.06em] text-[#111827]">Entrou e usou.</h1>
				<p id="login-description" class="mt-4 text-base leading-7 text-[#6b7280]">
					Acesse a área interna do Ap202 e administre unidades, despesas e cadastros com um fluxo direto e leve.
				</p>
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
				<div id="login-preview-top" class="mb-5 flex items-center gap-2">
					<span id="login-preview-dot-1" class="size-3 rounded-full bg-[#fb7185]"></span>
					<span id="login-preview-dot-2" class="size-3 rounded-full bg-[#fbbf24]"></span>
					<span id="login-preview-dot-3" class="size-3 rounded-full bg-[#34d399]"></span>
				</div>
				<div
					id="login-preview-shell"
					class="rounded-[24px] border border-[#eceef2] bg-[linear-gradient(180deg,#f8fafc_0%,#eef4d2_100%)] p-4"
				>
					<div
						id="login-preview-sidebar"
						class="relative h-[420px] overflow-hidden rounded-[20px] border border-[#d9e1cc] bg-[linear-gradient(180deg,#eff5c8_0%,#e5edbd_100%)]"
					>
						<div
							id="login-preview-illustration-glow"
							class="absolute -top-10 left-8 h-44 w-44 rounded-full bg-[#99f6e4]/60 blur-3xl"
						></div>
						<div
							id="login-preview-illustration-glow-2"
							class="absolute right-8 bottom-10 h-40 w-40 rounded-full bg-[#60a5fa]/35 blur-3xl"
						></div>

						<div
							id="login-preview-condominium-base"
							class="absolute left-1/2 top-[62%] h-[250px] w-[300px] -translate-x-1/2 -translate-y-1/2 rotate-[-28deg] rounded-[28px] border border-[#a8b59a] bg-[#f8fafc] shadow-[0_18px_30px_rgba(61,87,53,0.12)]"
						></div>

						<div
							id="login-preview-condominium-court"
							class="absolute right-[42px] top-[134px] h-[116px] w-[112px] skew-y-[-28deg] rounded-[10px] border border-[#a8b59a] bg-[linear-gradient(180deg,#d9ebc3_0%,#c5ddae_100%)]"
						></div>
						<div id="login-preview-condominium-court-line-1" class="absolute right-[66px] top-[160px] h-[58px] w-[1px] bg-[#a3b89a]"></div>
						<div id="login-preview-condominium-court-line-2" class="absolute right-[92px] top-[176px] h-[1px] w-[62px] bg-[#a3b89a]"></div>

						<div
							id="login-preview-condominium-gate"
							class="absolute left-[38px] bottom-[92px] h-[40px] w-[92px] rotate-[-28deg] rounded-[10px] border border-[#9eac91] bg-[#dce8c7]"
						></div>
						<div id="login-preview-condominium-gate-roof" class="absolute left-[48px] bottom-[120px] h-[6px] w-[72px] rotate-[-28deg] rounded-full bg-[#94a382]"></div>

						<div
							id="login-preview-building-back-left"
							class="absolute left-[74px] top-[118px] h-[132px] w-[74px] rounded-t-[8px] rounded-b-[18px] border border-[#8ea28a] bg-[#cfe5c9]"
						>
							<div id="login-preview-building-back-left-roof" class="mx-auto mt-[-16px] h-[24px] w-[52px] rounded-[6px] border border-[#7c9098] bg-[linear-gradient(180deg,#8aa0d0_0%,#7188bf_100%)]"></div>
							<div id="login-preview-building-back-left-windows" class="mx-auto mt-4 grid w-[46px] grid-cols-3 gap-1">
								{#each Array(15) as _, index}
									<div id={`login-preview-building-back-left-window-${index + 1}`} class="h-[6px] rounded-[2px] bg-[#f7f2c9]"></div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-building-back-center"
							class="absolute left-[154px] top-[88px] h-[170px] w-[86px] rounded-t-[10px] rounded-b-[20px] border border-[#8ea28a] bg-[#d8ecd2]"
						>
							<div id="login-preview-building-back-center-roof" class="mx-auto mt-[-18px] h-[28px] w-[60px] rounded-[6px] border border-[#7c9098] bg-[linear-gradient(180deg,#8aa0d0_0%,#7188bf_100%)]"></div>
							<div id="login-preview-building-back-center-windows" class="mx-auto mt-5 grid w-[54px] grid-cols-3 gap-1.5">
								{#each Array(18) as _, index}
									<div id={`login-preview-building-back-center-window-${index + 1}`} class="h-[6px] rounded-[2px] bg-[#f7f2c9]"></div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-building-front"
							class="absolute left-[160px] top-[204px] h-[132px] w-[82px] rounded-t-[10px] rounded-b-[20px] border border-[#8ea28a] bg-[#d4e8cd]"
						>
							<div id="login-preview-building-front-roof" class="mx-auto mt-[-16px] h-[24px] w-[56px] rounded-[6px] border border-[#7c9098] bg-[linear-gradient(180deg,#8aa0d0_0%,#7188bf_100%)]"></div>
							<div id="login-preview-building-front-windows" class="mx-auto mt-4 grid w-[50px] grid-cols-3 gap-1.5">
								{#each Array(15) as _, index}
									<div id={`login-preview-building-front-window-${index + 1}`} class="h-[6px] rounded-[2px] bg-[#f7f2c9]"></div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-building-right"
							class="absolute right-[62px] top-[138px] h-[146px] w-[82px] rounded-t-[10px] rounded-b-[20px] border border-[#8ea28a] bg-[#d3e7cc]"
						>
							<div id="login-preview-building-right-roof" class="mx-auto mt-[-16px] h-[24px] w-[56px] rounded-[6px] border border-[#7c9098] bg-[linear-gradient(180deg,#8aa0d0_0%,#7188bf_100%)]"></div>
							<div id="login-preview-building-right-windows" class="mx-auto mt-4 grid w-[50px] grid-cols-3 gap-1.5">
								{#each Array(15) as _, index}
									<div id={`login-preview-building-right-window-${index + 1}`} class="h-[6px] rounded-[2px] bg-[#f7f2c9]"></div>
								{/each}
							</div>
						</div>

						<div id="login-preview-tree-1" class="absolute left-[118px] top-[272px]">
							<div id="login-preview-tree-1-crown" class="h-[30px] w-[30px] rounded-full border border-[#93a085] bg-[#c8dfbf]"></div>
							<div id="login-preview-tree-1-trunk" class="mx-auto h-[22px] w-[3px] bg-[#7c6b56]"></div>
						</div>
						<div id="login-preview-tree-2" class="absolute left-[90px] top-[300px]">
							<div id="login-preview-tree-2-crown" class="h-[26px] w-[26px] rounded-full border border-[#93a085] bg-[#c8dfbf]"></div>
							<div id="login-preview-tree-2-trunk" class="mx-auto h-[18px] w-[3px] bg-[#7c6b56]"></div>
						</div>
						<div id="login-preview-tree-3" class="absolute left-[150px] top-[306px]">
							<div id="login-preview-tree-3-crown" class="h-[22px] w-[22px] rounded-full border border-[#93a085] bg-[#c8dfbf]"></div>
							<div id="login-preview-tree-3-trunk" class="mx-auto h-[14px] w-[3px] bg-[#7c6b56]"></div>
						</div>

						<div
							id="login-preview-car-1"
							class="absolute left-[42px] top-[168px] h-[18px] w-[26px] rounded-[8px] border border-[#98a88b] bg-[#d7e0bc]"
						></div>
						<div
							id="login-preview-car-2"
							class="absolute right-[30px] top-[290px] h-[18px] w-[26px] rounded-[8px] border border-[#98a88b] bg-[#d7e0bc]"
						></div>
						<div
							id="login-preview-car-3"
							class="absolute left-[86px] bottom-[44px] h-[18px] w-[26px] rounded-[8px] border border-[#98a88b] bg-[#d7e0bc]"
						></div>

						<div id="login-preview-post-1" class="absolute left-[28px] top-[142px] h-[32px] w-[2px] bg-[#7f8a72]"></div>
						<div id="login-preview-post-2" class="absolute left-[58px] bottom-[62px] h-[30px] w-[2px] bg-[#7f8a72]"></div>
						<div id="login-preview-post-3" class="absolute right-[26px] top-[118px] h-[34px] w-[2px] bg-[#7f8a72]"></div>
						<div id="login-preview-post-4" class="absolute right-[44px] bottom-[72px] h-[32px] w-[2px] bg-[#7f8a72]"></div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
