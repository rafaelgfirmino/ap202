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
					class="rounded-[24px] border border-[#eceef2] bg-[radial-gradient(circle_at_top,#ffffff_0%,#f8fafc_46%,#eff6ff_100%)] p-4"
				>
					<div
						id="login-preview-sidebar"
						class="relative h-[420px] overflow-hidden rounded-[20px] border border-[#e3e8ef] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)]"
					>
						<div id="login-preview-grid" class="absolute inset-0 bg-[linear-gradient(rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:34px_34px] opacity-55"></div>
						<div id="login-preview-grid-mask" class="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,rgba(255,255,255,0.7)_100%)]"></div>

						<div
							id="login-preview-float-card-financial"
							class="absolute left-[34px] top-[226px] flex w-[122px] -rotate-[18deg] flex-col gap-2 rounded-[18px] border border-[#d9e3ee] bg-white/95 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
						>
							<div id="login-preview-float-card-financial-bar-1" class="h-2 w-14 rounded-full bg-[#0f172a]"></div>
							<div id="login-preview-float-card-financial-bar-2" class="h-2 w-20 rounded-full bg-[#cbd5e1]"></div>
							<div id="login-preview-float-card-financial-row" class="mt-2 flex items-end gap-1">
								<div id="login-preview-float-card-financial-col-1" class="h-6 w-4 rounded-t-md bg-[#bfdbfe]"></div>
								<div id="login-preview-float-card-financial-col-2" class="h-9 w-4 rounded-t-md bg-[#60a5fa]"></div>
								<div id="login-preview-float-card-financial-col-3" class="h-12 w-4 rounded-t-md bg-[#0f172a]"></div>
							</div>
						</div>

						<div
							id="login-preview-float-card-units"
							class="absolute right-[42px] top-[250px] flex w-[138px] rotate-[16deg] flex-col gap-2 rounded-[18px] border border-[#d9e3ee] bg-white/95 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
						>
							<div id="login-preview-float-card-units-title" class="h-2 w-18 rounded-full bg-[#0f172a]"></div>
							<div id="login-preview-float-card-units-row-1" class="flex gap-2">
								<div class="h-7 flex-1 rounded-xl bg-[#eff6ff]"></div>
								<div class="h-7 w-8 rounded-xl bg-[#dbeafe]"></div>
							</div>
							<div id="login-preview-float-card-units-row-2" class="flex gap-2">
								<div class="h-7 flex-1 rounded-xl bg-[#f8fafc]"></div>
								<div class="h-7 w-8 rounded-xl bg-[#e2e8f0]"></div>
							</div>
						</div>

						<div
							id="login-preview-float-card-residents"
							class="absolute right-[88px] top-[72px] flex w-[96px] rotate-[12deg] flex-col gap-2 rounded-[18px] border border-[#d9e3ee] bg-white/92 p-3 shadow-[0_16px_34px_rgba(15,23,42,0.08)]"
						>
							<div id="login-preview-float-card-residents-avatar-row" class="flex gap-2">
								<div class="size-7 rounded-full bg-[#0f172a]"></div>
								<div class="size-7 rounded-full bg-[#93c5fd]"></div>
							</div>
							<div id="login-preview-float-card-residents-line" class="h-2 w-14 rounded-full bg-[#cbd5e1]"></div>
						</div>

						<div
							id="login-preview-connector-left"
							class="absolute left-[136px] top-[254px] h-[1px] w-[84px] rotate-[18deg] bg-[#cbd5e1]"
						></div>
						<div
							id="login-preview-connector-right"
							class="absolute right-[130px] top-[246px] h-[1px] w-[88px] -rotate-[18deg] bg-[#cbd5e1]"
						></div>
						<div
							id="login-preview-connector-top"
							class="absolute right-[154px] top-[132px] h-[1px] w-[92px] -rotate-[36deg] bg-[#cbd5e1]"
						></div>

						<div
							id="login-preview-condo-stage-bottom"
							class="absolute left-1/2 top-[56%] h-[120px] w-[214px] -translate-x-1/2 -translate-y-1/2 rotate-[-31deg] rounded-[26px] border border-[#9ca3af] bg-[#d1d5db] shadow-[0_16px_28px_rgba(15,23,42,0.14)]"
						></div>
						<div
							id="login-preview-condo-stage-middle"
							class="absolute left-1/2 top-[49%] h-[112px] w-[202px] -translate-x-1/2 -translate-y-1/2 rotate-[-31deg] rounded-[24px] border border-[#d8dee7] bg-white shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
						></div>
						<div
							id="login-preview-condo-stage-top"
							class="absolute left-1/2 top-[42%] h-[104px] w-[188px] -translate-x-1/2 -translate-y-1/2 rotate-[-31deg] rounded-[22px] border border-[#dbe3ee] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_16px_28px_rgba(15,23,42,0.08)]"
						></div>

						<div
							id="login-preview-condo-building-left"
							class="absolute left-[132px] top-[124px] h-[106px] w-[44px] rotate-[-8deg] rounded-t-[10px] rounded-b-[12px] border border-[#94a3b8] bg-[linear-gradient(180deg,#f8fafc_0%,#dbeafe_100%)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
						>
							<div id="login-preview-condo-building-left-roof" class="h-5 rounded-t-[10px] border-b border-[#cbd5e1] bg-white"></div>
							<div id="login-preview-condo-building-left-windows" class="mx-auto mt-2 grid w-[26px] grid-cols-2 gap-1">
								{#each Array(10) as _, index}
									<div id={`login-preview-condo-building-left-window-${index + 1}`} class="h-[6px] rounded-[2px] bg-[#bfdbfe]"></div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-condo-building-center"
							class="absolute left-[184px] top-[96px] h-[142px] w-[56px] rotate-[-8deg] rounded-t-[12px] rounded-b-[14px] border border-[#94a3b8] bg-[linear-gradient(180deg,#f8fafc_0%,#dbeafe_100%)] shadow-[0_14px_28px_rgba(15,23,42,0.1)]"
						>
							<div id="login-preview-condo-building-center-roof" class="h-6 rounded-t-[12px] border-b border-[#cbd5e1] bg-white"></div>
							<div id="login-preview-condo-building-center-windows" class="mx-auto mt-2 grid w-[34px] grid-cols-2 gap-1">
								{#each Array(14) as _, index}
									<div id={`login-preview-condo-building-center-window-${index + 1}`} class="h-[7px] rounded-[2px] bg-[#93c5fd]"></div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-condo-building-right"
							class="absolute left-[252px] top-[138px] h-[96px] w-[46px] rotate-[-8deg] rounded-t-[10px] rounded-b-[12px] border border-[#94a3b8] bg-[linear-gradient(180deg,#f8fafc_0%,#dbeafe_100%)] shadow-[0_10px_22px_rgba(15,23,42,0.08)]"
						>
							<div id="login-preview-condo-building-right-roof" class="h-5 rounded-t-[10px] border-b border-[#cbd5e1] bg-white"></div>
							<div id="login-preview-condo-building-right-windows" class="mx-auto mt-2 grid w-[28px] grid-cols-2 gap-1">
								{#each Array(10) as _, index}
									<div id={`login-preview-condo-building-right-window-${index + 1}`} class="h-[6px] rounded-[2px] bg-[#bfdbfe]"></div>
								{/each}
							</div>
						</div>

						<div
							id="login-preview-condo-court"
							class="absolute left-[258px] top-[224px] h-[62px] w-[94px] rotate-[-31deg] rounded-[14px] border border-[#bfdbfe] bg-[linear-gradient(180deg,#eff6ff_0%,#dbeafe_100%)]"
						></div>
						<div id="login-preview-condo-court-line-1" class="absolute left-[300px] top-[236px] h-[38px] w-[1px] bg-[#93c5fd]"></div>
						<div id="login-preview-condo-court-line-2" class="absolute left-[280px] top-[255px] h-[1px] w-[42px] bg-[#93c5fd]"></div>

						<div
							id="login-preview-condo-tree"
							class="absolute left-[146px] top-[250px] flex flex-col items-center"
						>
							<div id="login-preview-condo-tree-crown" class="size-8 rounded-full border border-[#94a3b8] bg-[#dbeafe]"></div>
							<div id="login-preview-condo-tree-trunk" class="h-5 w-[3px] bg-[#64748b]"></div>
						</div>

						<div
							id="login-preview-condo-car"
							class="absolute left-[112px] top-[282px] h-[16px] w-[30px] rotate-[-30deg] rounded-[8px] border border-[#94a3b8] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.06)]"
						></div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
