<script lang="ts">
	import BellRingIcon from '@lucide/svelte/icons/bell-ring';
	import ChevronsLeftIcon from '@lucide/svelte/icons/chevrons-left';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
	import ChevronsRightIcon from '@lucide/svelte/icons/chevrons-right';
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
	import FileDownIcon from '@lucide/svelte/icons/file-down';
	import HandCoinsIcon from '@lucide/svelte/icons/hand-coins';
	import MailIcon from '@lucide/svelte/icons/mail';
	import MapPinnedIcon from '@lucide/svelte/icons/map-pinned';
	import PhoneIcon from '@lucide/svelte/icons/phone';
	import FinancialStatusBadge from '$lib/components/app/FinancialStatusBadge.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Tabs from '$lib/components/ui/tabs/index.js';
	import { cn } from '$lib/utils.js';
	import type { Unit } from '$lib/services/units.js';

	type FinancialStatus = 'adimplente' | 'inadimplente';
	type PaymentStatus = 'paid_on_time' | 'paid_late' | 'expired' | 'open';
	type InvoiceStatus = 'paid' | 'open' | 'expired' | 'pending';
	type ChargeType = 'cota' | 'extra' | 'multa' | 'rateio';
	type OccupancyType = 'Proprietário' | 'Locatário' | 'Usufruto';
	type InvoiceFilter = 'all' | 'paid' | 'open' | 'expired' | 'pending';
	type BalanceFilter = 'all' | 'paid' | 'open' | 'expired';
	type ResidentFilter = 'all' | 'owners' | 'occupants';

	interface Props {
		unit: Unit;
	}

	interface ResidentProfile {
		name: string;
		initials: string;
		occupancyType: OccupancyType;
		rentalStatusLabel: string;
		occupiedSince: string;
		phone: string;
		email: string;
		blockLabel: string;
		towerLabel: string;
		parkingSpots: number;
		idealFractionLabel: string;
		privateAreaLabel: string;
	}

	interface ResidentTableItem {
		id: string;
		name: string;
		roleLabel: string;
		occupancyLabel: string;
		phone: string;
		email: string;
		sinceLabel: string;
	}

	interface KpiItem {
		label: string;
		value: string;
		helper: string;
		tone: 'neutral' | 'positive' | 'negative';
	}

	interface PaymentHistoryItem {
		referenceKey: string;
		referenceLabel: string;
		amount: number;
		status: PaymentStatus;
		statusLabel: string;
		delayDays: number;
	}

	interface DebtSummary {
		principal: number;
		interest: number;
		fine: number;
		pendingAllocations: number;
		total: number;
		annualQuotaShare: number;
	}

	interface InvoiceItem {
		id: string;
		referenceLabel: string;
		type: ChargeType;
		description: string;
		dueDate: string;
		amount: number;
		status: InvoiceStatus;
		paymentDate: string | null;
		invoiceActionLabel: string;
		balanceActionLabel: string;
	}

	interface AnnualSummaryItem {
		monthLabel: string;
		amount: number;
		statusLabel: string;
		balanceActionLabel: string;
	}

	interface TimelineEvent {
		date: string;
		title: string;
		description: string;
		tone: 'neutral' | 'positive' | 'negative';
	}

	interface UnitFinancialSnapshot {
		status: FinancialStatus;
		statusLabel: string;
		healthScore: number;
		competenceLabel: string;
		lastPaymentLabel: string;
		maxDelayLabel: string;
		currentSituationLabel: string;
		totalPaidLast12Months: number;
		paidInvoicesCount: number;
		totalFinesAndInterest: number;
		totalDebt: number;
		openMonthsCount: number;
		nextDueDateLabel: string;
		nextInvoiceAmount: number;
		totalChargesInPeriod: number;
		adminNote: string;
		paymentHistory: PaymentHistoryItem[];
		debtSummary: DebtSummary | null;
		invoices: InvoiceItem[];
		extraCharges: InvoiceItem[];
		annualSummary: AnnualSummaryItem[];
		timeline: TimelineEvent[];
	}

	const { unit }: Props = $props();

	let selectedInvoiceFilter = $state<InvoiceFilter>('all');
	let selectedBalanceFilter = $state<BalanceFilter>('all');
	let selectedResidentFilter = $state<ResidentFilter>('all');
	let activeFinancialTab = $state<'invoices' | 'annual' | 'residents'>('invoices');
	let periodStartMonth = $state('');
	let periodEndMonth = $state('');
	let invoicesPageSize = $state(10);
	let invoicesCurrentPage = $state(1);
	let annualPageSize = $state(10);
	let annualCurrentPage = $state(1);
	let residentsPageSize = $state(10);
	let residentsCurrentPage = $state(1);

	function formatCurrency(value: number): string {
		return value.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		});
	}

	function formatDate(value: string): string {
		return new Intl.DateTimeFormat('pt-BR', {
			day: '2-digit',
			month: '2-digit',
			year: 'numeric'
		}).format(new Date(value));
	}

	function getMonthReference(offset: number): Date {
		const date = new Date();
		date.setDate(1);
		date.setMonth(date.getMonth() + offset);
		return date;
	}

	function getMonthLabel(date: Date): string {
		return new Intl.DateTimeFormat('pt-BR', {
			month: '2-digit',
			year: 'numeric'
		}).format(date);
	}

	function formatMonthYear(date: Date): string {
		return new Intl.DateTimeFormat('pt-BR', {
			month: '2-digit',
			year: 'numeric'
		}).format(date);
	}

	function toMonthInputValue(date: Date): string {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	function getMonthKeyFromDateString(value: string): string {
		const date = new Date(value);
		return toMonthInputValue(date);
	}

	function getMonthKeyFromLabel(value: string): string {
		const [month, year] = value.split('/');
		if (!month || !year) {
			return '';
		}

		return `${year}-${month}`;
	}

	function isWithinSelectedPeriod(monthKey: string): boolean {
		if (!monthKey) {
			return true;
		}

		if (periodStartMonth && monthKey < periodStartMonth) {
			return false;
		}

		if (periodEndMonth && monthKey > periodEndMonth) {
			return false;
		}

		return true;
	}

	function getPhone(seed: number): string {
		const suffix = String(1000 + (seed % 9000)).padStart(4, '0');
		const middle = String(90000 + (seed % 9999)).slice(0, 5);
		return `(11) ${middle}-${suffix}`;
	}

	function getResidentProfile(unitValue: Unit): ResidentProfile {
		const occupantNames = [
			'Ana Martins',
			'Bruno Almeida',
			'Camila Rocha',
			'Diego Ferreira',
			'Elisa Nogueira',
			'Felipe Duarte'
		];
		const occupancyTypes: OccupancyType[] = ['Proprietário', 'Locatário', 'Usufruto'];
		const residentName = occupantNames[unitValue.id % occupantNames.length] ?? 'Morador não identificado';
		const initials = residentName
			.split(' ')
			.slice(0, 2)
			.map((part) => part[0] ?? '')
			.join('')
			.toUpperCase();
		const blockLabel = unitValue.group_name ? `Bloco ${unitValue.group_name}` : 'Bloco principal';
		const towerLabel = unitValue.group_type ? `Torre ${unitValue.group_type}` : 'Torre única';
		const fractionValue =
			unitValue.ideal_fraction != null ? unitValue.ideal_fraction : 0.42 + ((unitValue.id % 9) * 0.06);
		const occupiedSinceDate = new Date(2020 + (unitValue.id % 4), (unitValue.id * 3) % 12, 1);

		return {
			name: residentName,
			initials,
			occupancyType: occupancyTypes[unitValue.id % occupancyTypes.length] ?? 'Proprietário',
			rentalStatusLabel:
				(occupancyTypes[unitValue.id % occupancyTypes.length] ?? 'Proprietário') === 'Locatário'
					? 'Alugado'
					: 'Não alugado',
			occupiedSince: formatMonthYear(occupiedSinceDate),
			phone: getPhone(unitValue.id),
			email: `${residentName.toLowerCase().replaceAll(' ', '.')}@condomail.com.br`,
			blockLabel,
			towerLabel,
			parkingSpots: 1 + (unitValue.id % 2),
			idealFractionLabel: `${fractionValue.toFixed(2).replace('.', ',')}%`,
			privateAreaLabel:
				unitValue.private_area != null
					? `${unitValue.private_area.toLocaleString('pt-BR', {
							minimumFractionDigits: Number.isInteger(unitValue.private_area) ? 0 : 2,
							maximumFractionDigits: 2
						})} m²`
					: 'Não informada'
		};
	}

	function getPaymentStatusLabel(status: PaymentStatus): string {
		switch (status) {
			case 'paid_on_time':
				return 'Pago no prazo';
			case 'paid_late':
				return 'Pago com atraso';
			case 'expired':
				return 'Expirado';
			default:
				return 'Em aberto';
		}
	}

	function getInvoiceStatusLabel(status: InvoiceStatus): string {
		switch (status) {
			case 'paid':
				return 'Paga';
			case 'open':
				return 'Em aberto';
			case 'expired':
				return 'Expirada';
			default:
				return 'Pendente';
		}
	}

	function getTypeLabel(type: ChargeType): string {
		switch (type) {
			case 'cota':
				return 'Cota';
			case 'extra':
				return 'Extra';
			case 'multa':
				return 'Multa';
			default:
				return 'Rateio';
		}
	}

	function getFinancialSnapshot(unitValue: Unit): UnitFinancialSnapshot {
		const overdue = unitValue.id % 3 === 0 || unitValue.id % 5 === 0;
		const paymentHistory = Array.from({ length: 12 }, (_, index) => {
			const referenceDate = getMonthReference(index - 11);
			const baseAmount = 480 + ((unitValue.id + index) % 6) * 36;
			let status: PaymentStatus = 'paid_on_time';
			let delayDays = 0;

			if (overdue && index >= 9) {
				status = index === 11 ? 'open' : index === 10 ? 'expired' : 'paid_late';
				delayDays = index === 9 ? 6 : index === 10 ? 24 : 11;
			} else if (!overdue && index % 5 === 0) {
				status = 'paid_late';
				delayDays = 3 + (index % 4);
			}

			return {
				referenceKey: `${referenceDate.getFullYear()}-${referenceDate.getMonth() + 1}`,
				referenceLabel: getMonthLabel(referenceDate),
				amount: baseAmount,
				status,
				statusLabel: getPaymentStatusLabel(status),
				delayDays
			} satisfies PaymentHistoryItem;
		});

		const monthlyInvoices = paymentHistory.map((item, index) => {
			const dueDate = new Date(getMonthReference(index - 11));
			dueDate.setDate(10 + (unitValue.id % 5));
			const paymentDate =
				item.status === 'paid_on_time'
					? new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() - 1)
					: item.status === 'paid_late'
						? new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + item.delayDays)
						: null;

			return {
				id: `invoice-${item.referenceKey}`,
				referenceLabel: item.referenceLabel,
				type: 'cota' as const,
				description: `Cota condominial da competência ${item.referenceLabel}`,
				dueDate: dueDate.toISOString(),
				amount: item.amount,
				status:
					item.status === 'paid_on_time' || item.status === 'paid_late'
						? ('paid' as const)
						: item.status === 'expired'
							? ('expired' as const)
							: ('open' as const),
				paymentDate: paymentDate?.toISOString() ?? null,
				invoiceActionLabel: 'Baixar fatura',
				balanceActionLabel: 'Baixar balancete'
			} satisfies InvoiceItem;
		});

		const extraCharges: InvoiceItem[] = overdue
			? [
					{
						id: `extra-rateio-${unitValue.id}`,
						referenceLabel: 'Mar 2026',
						type: 'rateio',
						description: 'Rateio extraordinário da fachada',
						dueDate: new Date(2026, 2, 22).toISOString(),
						amount: 185,
						status: 'open',
						paymentDate: null,
						invoiceActionLabel: 'Baixar fatura',
						balanceActionLabel: 'Baixar balancete'
					},
					{
						id: `extra-multa-${unitValue.id}`,
						referenceLabel: 'Abr 2026',
						type: 'multa',
						description: 'Multa por atraso acumulado',
						dueDate: new Date(2026, 3, 10).toISOString(),
						amount: 62,
						status: 'pending',
						paymentDate: null,
						invoiceActionLabel: 'Baixar fatura',
						balanceActionLabel: 'Baixar balancete'
					}
				]
			: [
					{
						id: `extra-segunda-via-${unitValue.id}`,
						referenceLabel: 'Fev 2026',
						type: 'extra',
						description: 'Segunda via de boleto emitida',
						dueDate: new Date(2026, 1, 18).toISOString(),
						amount: 18,
						status: 'paid',
						paymentDate: new Date(2026, 1, 17).toISOString(),
						invoiceActionLabel: 'Baixar fatura',
						balanceActionLabel: 'Baixar balancete'
					}
				];

		const invoices = [...monthlyInvoices, ...extraCharges];
		const totalPaidLast12Months = invoices
			.filter((invoice) => invoice.status === 'paid')
			.reduce((total, invoice) => total + invoice.amount, 0);
		const paidInvoicesCount = invoices.filter((invoice) => invoice.status === 'paid').length;
		const totalFinesAndInterest = overdue ? 148 : 18;
		const totalDebt = overdue
			? invoices
					.filter((invoice) => invoice.status === 'open' || invoice.status === 'expired' || invoice.status === 'pending')
					.reduce((total, invoice) => total + invoice.amount, 0) + totalFinesAndInterest
			: 0;
		const openMonthsCount = paymentHistory.filter(
			(item) => item.status === 'open' || item.status === 'expired'
		).length;
		const nextDueDate = new Date();
		nextDueDate.setDate(10 + (unitValue.id % 5));
		nextDueDate.setMonth(nextDueDate.getMonth() + 1);
		const nextInvoiceAmount = 510 + (unitValue.id % 4) * 35;
		const lastPaidInvoice = [...invoices].reverse().find((invoice) => invoice.paymentDate != null);
		const maxDelay = paymentHistory.reduce((max, item) => Math.max(max, item.delayDays), 0);
		const annualSummary = Array.from({ length: 12 }, (_, index) => ({
			monthLabel: getMonthLabel(getMonthReference(index - 11)).split(' ')[0] ?? '',
			amount: overdue && index >= 9 ? paymentHistory[index]?.amount ?? 0 : paymentHistory[index]?.amount ?? 0,
			statusLabel:
				paymentHistory[index]?.status === 'paid_on_time' || paymentHistory[index]?.status === 'paid_late'
					? 'Adimplente'
					: 'Inadimplente',
			balanceActionLabel: 'Baixar balancete'
		})) satisfies AnnualSummaryItem[];

		return {
			status: overdue ? 'inadimplente' : 'adimplente',
			statusLabel: overdue ? 'Inadimplente' : 'Adimplente',
			healthScore: overdue ? 48 : 93,
			competenceLabel: getMonthLabel(getMonthReference(0)),
			lastPaymentLabel: lastPaidInvoice?.paymentDate ? formatDate(lastPaidInvoice.paymentDate) : 'Sem registro',
			maxDelayLabel: maxDelay > 0 ? `${maxDelay} dias` : 'Sem atrasos',
			currentSituationLabel: overdue ? 'Com pendências' : 'Em dia',
			totalPaidLast12Months,
			paidInvoicesCount,
			totalFinesAndInterest,
			totalDebt,
			openMonthsCount,
			nextDueDateLabel: formatDate(nextDueDate.toISOString()),
			nextInvoiceAmount,
			totalChargesInPeriod: invoices.length,
			adminNote: overdue
				? 'Unidade com contato ativo para regularização e histórico recente de atraso.'
				: 'Unidade com histórico estável e baixo risco de inadimplência.',
			paymentHistory,
			debtSummary: overdue
				? {
						principal: totalDebt - totalFinesAndInterest,
						interest: 96,
						fine: 52,
						pendingAllocations: 185,
						total: totalDebt,
						annualQuotaShare: Math.min(100, Math.round((totalDebt / (nextInvoiceAmount * 12)) * 100))
					}
				: null,
			invoices,
			extraCharges,
			annualSummary,
			timeline: overdue
				? [
						{
							date: formatDate(new Date().toISOString()),
							title: 'Pendência acompanhada',
							description: 'A administração registrou retorno pendente sobre proposta de parcelamento.',
							tone: 'negative'
						},
						{
							date: formatDate(new Date(new Date().setDate(new Date().getDate() - 12)).toISOString()),
							title: 'Lembrete enviado',
							description: 'Disparo de lembrete automático por e-mail e WhatsApp.',
							tone: 'neutral'
						},
						{
							date: formatDate(new Date(new Date().setDate(new Date().getDate() - 28)).toISOString()),
							title: 'Pagamento parcial',
							description: 'Foi compensada uma parte da competência anterior com atraso.',
							tone: 'positive'
						}
					]
				: [
						{
							date: formatDate(new Date().toISOString()),
							title: 'Unidade regular',
							description: 'Sem pendências financeiras no fechamento atual.',
							tone: 'positive'
						},
						{
							date: formatDate(new Date(new Date().setDate(new Date().getDate() - 34)).toISOString()),
							title: 'Pagamento confirmado',
							description: 'A última cota foi compensada antes do vencimento.',
							tone: 'positive'
						},
						{
							date: formatDate(new Date(new Date().setDate(new Date().getDate() - 76)).toISOString()),
							title: 'Extrato emitido',
							description: 'Morador baixou o extrato anual completo da unidade.',
							tone: 'neutral'
						}
					]
		};
	}

	const resident = $derived(getResidentProfile(unit));
	const financial = $derived(getFinancialSnapshot(unit));
	const invoiceFilters = [
		{ key: 'all', label: 'Todas' },
		{ key: 'paid', label: 'Pagas' },
		{ key: 'open', label: 'Em aberto' },
		{ key: 'expired', label: 'Expiradas' },
		{ key: 'pending', label: 'Pendentes' }
	] satisfies { key: InvoiceFilter; label: string }[];
	const filteredInvoices = $derived(
		selectedInvoiceFilter === 'all'
			? financial.invoices.filter((invoice) => isWithinSelectedPeriod(getMonthKeyFromDateString(invoice.dueDate)))
			: financial.invoices.filter(
					(invoice) =>
						invoice.status === selectedInvoiceFilter &&
						isWithinSelectedPeriod(getMonthKeyFromDateString(invoice.dueDate))
				)
	);
	const balanceFilters = [
		{ key: 'all', label: 'Todos' },
		{ key: 'paid', label: 'Adimplentes' },
		{ key: 'open', label: 'Inadimplentes' },
		{ key: 'expired', label: 'Inadimplentes' }
	] satisfies { key: BalanceFilter; label: string }[];
	const filteredAnnualSummary = $derived(
		selectedBalanceFilter === 'all'
			? financial.annualSummary.filter((item) => isWithinSelectedPeriod(getMonthKeyFromLabel(item.monthLabel)))
			: financial.annualSummary.filter((item) =>
					(selectedBalanceFilter === 'paid'
						? item.statusLabel === 'Adimplente'
						: selectedBalanceFilter === 'expired'
							? item.statusLabel === 'Inadimplente'
							: item.statusLabel === 'Inadimplente') &&
					isWithinSelectedPeriod(getMonthKeyFromLabel(item.monthLabel))
				)
	);
	const residentFilters = [
		{ key: 'all', label: 'Todos' },
		{ key: 'owners', label: 'Proprietários' },
		{ key: 'occupants', label: 'Moradores atuais' }
	] satisfies { key: ResidentFilter; label: string }[];
	const residents = $derived.by(() => {
		const ownerName = `Proprietário da unidade ${unit.identifier}`;
		const ownerSinceDate = new Date(2019 + (unit.id % 3), (unit.id + 2) % 12, 1);
		const ownerSinceLabel = formatMonthYear(ownerSinceDate);
		const baseOwner = {
			id: `owner-${unit.id}`,
			name: ownerName,
			roleLabel: 'Proprietário',
			occupancyLabel: resident.occupancyType === 'Locatário' ? 'Não residente' : 'Morador atual',
			phone: getPhone(unit.id + 100),
			email: `proprietario.${unit.id}@condomail.com.br`,
			sinceLabel: ownerSinceLabel
		} satisfies ResidentTableItem;

		if (resident.occupancyType === 'Locatário') {
			return [
				baseOwner,
				{
					id: `tenant-${unit.id}`,
					name: resident.name,
					roleLabel: 'Inquilino',
					occupancyLabel: 'Morador atual',
					phone: resident.phone,
					email: resident.email,
					sinceLabel: resident.occupiedSince
				} satisfies ResidentTableItem
			];
		}

		if (resident.occupancyType === 'Usufruto') {
			return [
				baseOwner,
				{
					id: `usufruct-${unit.id}`,
					name: resident.name,
					roleLabel: 'Usufrutuário',
					occupancyLabel: 'Morador atual',
					phone: resident.phone,
					email: resident.email,
					sinceLabel: resident.occupiedSince
				} satisfies ResidentTableItem
			];
		}

		return [
			{
				...baseOwner,
				name: resident.name,
				phone: resident.phone,
				email: resident.email,
				sinceLabel: resident.occupiedSince
			}
		];
	});
	const filteredResidents = $derived(
		selectedResidentFilter === 'all'
			? residents
			: residents.filter((item) =>
					selectedResidentFilter === 'owners'
						? item.roleLabel === 'Proprietário'
						: item.occupancyLabel === 'Morador atual'
				)
	);
	const invoicesTotalPages = $derived(
		Math.max(1, Math.ceil(filteredInvoices.length / invoicesPageSize))
	);
	const pagedInvoices = $derived(
		filteredInvoices.slice(
			(invoicesCurrentPage - 1) * invoicesPageSize,
			invoicesCurrentPage * invoicesPageSize
		)
	);
	const annualTotalPages = $derived(
		Math.max(1, Math.ceil(filteredAnnualSummary.length / annualPageSize))
	);
	const pagedAnnualSummary = $derived(
		filteredAnnualSummary.slice(
			(annualCurrentPage - 1) * annualPageSize,
			annualCurrentPage * annualPageSize
		)
	);
	const residentsTotalPages = $derived(
		Math.max(1, Math.ceil(filteredResidents.length / residentsPageSize))
	);
	const pagedResidents = $derived(
		filteredResidents.slice(
			(residentsCurrentPage - 1) * residentsPageSize,
			residentsCurrentPage * residentsPageSize
		)
	);
	const kpis = $derived([
		{
			label: 'Situação atual',
			value: financial.currentSituationLabel,
			helper: `Competência ${financial.competenceLabel}`,
			tone: financial.status === 'adimplente' ? 'positive' : 'negative'
		},
		{
			label: 'Total pago em 12 meses',
			value: formatCurrency(financial.totalPaidLast12Months),
			helper: `${financial.paidInvoicesCount} faturas compensadas`,
			tone: 'neutral'
		},
		{
			label: 'Multas e juros',
			value: formatCurrency(financial.totalFinesAndInterest),
			helper: `Maior atraso: ${financial.maxDelayLabel}`,
			tone: financial.totalFinesAndInterest > 50 ? 'negative' : 'neutral'
		},
		{
			label: 'Dívida total',
			value: financial.totalDebt > 0 ? formatCurrency(financial.totalDebt) : 'Sem dívida',
			helper:
				financial.openMonthsCount > 0
					? `${financial.openMonthsCount} meses em aberto`
					: 'Nenhum mês em aberto',
			tone: financial.totalDebt > 0 ? 'negative' : 'positive'
		},
		{
			label: 'Próximo vencimento',
			value: financial.nextDueDateLabel,
			helper: `Boleto previsto em ${formatCurrency(financial.nextInvoiceAmount)}`,
			tone: 'neutral'
		}
	] satisfies KpiItem[]);
	const primaryKpis = $derived(kpis.slice(0, 4));
	const secondaryKpis = $derived(kpis.slice(4));
	const summaryPanelCards = $derived([
		{
			label: 'Situação atual',
			value: financial.currentSituationLabel,
			helper: `Competência ${financial.competenceLabel}`
		},
		{
			label: 'Dívida total',
			value: financial.totalDebt > 0 ? formatCurrency(financial.totalDebt) : 'Sem dívida',
			helper:
				financial.openMonthsCount > 0
					? `${financial.openMonthsCount} meses em aberto`
					: 'Nenhum mês em aberto'
		},
		{
			label: 'Próximo vencimento',
			value: financial.nextDueDateLabel,
			helper: formatCurrency(financial.nextInvoiceAmount)
		},
		{
			label: 'Total pago em 12 meses',
			value: formatCurrency(financial.totalPaidLast12Months),
			helper: `${financial.paidInvoicesCount} faturas compensadas`
		}
	]);
	const compactKpis = $derived([] as KpiItem[]);
	const actions = $derived(
		financial.status === 'adimplente'
			? [
					{ label: 'Baixar demonstrativo', icon: FileDownIcon }
				]
			: [
					{ label: 'Enviar cobrança', icon: BellRingIcon },
					{ label: 'Gerar acordo', icon: HandCoinsIcon },
					{ label: 'Baixar demonstrativo', icon: FileDownIcon }
				]
	);

	function getToneClasses(tone: 'neutral' | 'positive' | 'negative'): string {
		switch (tone) {
			case 'positive':
				return 'border-emerald-200 bg-emerald-50 text-emerald-700';
			case 'negative':
				return 'border-rose-200 bg-rose-50 text-rose-700';
			default:
				return 'border-border bg-muted/40 text-foreground';
		}
	}

	function getPaymentStatusClasses(status: PaymentStatus): string {
		switch (status) {
			case 'paid_on_time':
				return 'bg-emerald-100 text-emerald-700';
			case 'paid_late':
				return 'bg-amber-100 text-amber-700';
			case 'expired':
				return 'bg-rose-100 text-rose-700';
			default:
				return 'bg-sky-100 text-sky-700';
		}
	}

	function getInvoiceStatusClasses(status: InvoiceStatus): string {
		switch (status) {
			case 'paid':
				return 'bg-emerald-100 text-emerald-700';
			case 'expired':
				return 'bg-rose-100 text-rose-700';
			case 'pending':
				return 'bg-amber-100 text-amber-700';
			default:
				return 'bg-sky-100 text-sky-700';
		}
	}

	function getTimelineClasses(tone: TimelineEvent['tone']): string {
		return tone === 'positive'
			? 'border-emerald-200 bg-emerald-50'
			: tone === 'negative'
				? 'border-rose-200 bg-rose-50'
				: 'border-border bg-muted/35';
	}

	function getFilledSegments(value: number, maxValue: number, segments: number): number[] {
		const safeValue = Math.max(0, Math.min(value, maxValue));
		const filled = Math.max(1, Math.round((safeValue / maxValue) * segments));
		return Array.from({ length: filled }, (_, index) => index);
	}

	function getEmptySegments(value: number, maxValue: number, segments: number): number[] {
		const filled = getFilledSegments(value, maxValue, segments).length;
		return Array.from({ length: Math.max(0, segments - filled) }, (_, index) => index);
	}

	$effect(() => {
		selectedInvoiceFilter;
		invoicesCurrentPage = 1;
	});

	$effect(() => {
		invoicesPageSize;
		invoicesCurrentPage = 1;
	});

	$effect(() => {
		if (invoicesCurrentPage > invoicesTotalPages) {
			invoicesCurrentPage = invoicesTotalPages;
		}
	});

	$effect(() => {
		selectedBalanceFilter;
		annualCurrentPage = 1;
	});

	$effect(() => {
		annualPageSize;
		annualCurrentPage = 1;
	});

	$effect(() => {
		if (annualCurrentPage > annualTotalPages) {
			annualCurrentPage = annualTotalPages;
		}
	});

	$effect(() => {
		selectedResidentFilter;
		residentsCurrentPage = 1;
	});

	$effect(() => {
		residentsPageSize;
		residentsCurrentPage = 1;
	});

	$effect(() => {
		if (residentsCurrentPage > residentsTotalPages) {
			residentsCurrentPage = residentsTotalPages;
		}
	});
</script>

<div
	id="unit-financial-report-root"
	data-test="unit-financial-report-root"
	class="flex flex-col gap-4 rounded-3xl bg-background/95 p-4"
>
<section
	id="unit-financial-report-hero"
	data-test="unit-financial-report-hero"
	class="grid grid-cols-1 gap-3 rounded-2xl bg-gradient-to-br from-background via-muted/25 to-muted/60"
>
				<div
					id="unit-financial-report-identity"
					data-test="unit-financial-report-identity"
					class="flex flex-col gap-4"
				>
					<div
						id="unit-financial-report-headline"
						data-test="unit-financial-report-headline"
						class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
					>
						<div
							id="unit-financial-report-resident"
							data-test="unit-financial-report-resident"
							class="flex items-start gap-3"
						>
							<div
								id="unit-financial-report-avatar"
								data-test="unit-financial-report-avatar"
								class={cn(
									'flex size-12 items-center justify-center rounded-xl border text-sm font-semibold',
									financial.status === 'adimplente'
										? 'border-emerald-200 bg-emerald-50 text-emerald-700'
										: 'border-rose-200 bg-rose-50 text-rose-700'
								)}
							>
								{resident.initials}
							</div>

							<div
								id="unit-financial-report-resident-meta"
								data-test="unit-financial-report-resident-meta"
								class="space-y-0.5"
							>
								<div
									id="unit-financial-report-overline"
									data-test="unit-financial-report-overline"
									class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase"
								>
									Relatório financeiro da unidade
								</div>
								<h2
									id="unit-financial-report-resident-name"
									data-test="unit-financial-report-resident-name"
									class="text-xl font-semibold tracking-tight text-foreground"
								>
									{resident.name}
								</h2>
							</div>
						</div>

						<div
							id="unit-financial-report-status-group"
							data-test="unit-financial-report-status-group"
							class="flex flex-wrap gap-2"
						>
							<FinancialStatusBadge status={financial.status} />

						</div>
					</div>

					<div
						id="unit-financial-report-identity-grid"
						data-test="unit-financial-report-identity-grid"
						class="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-3"
					>
						<div class="rounded-xl border border-border/70 bg-background/80 p-2.5">
							<div class="text-xs tracking-[0.08em] text-muted-foreground uppercase">Tipo de ocupação</div>
							<div class="mt-1 font-semibold text-foreground">{resident.occupancyType}</div>
							<div class="mt-1 text-xs text-muted-foreground">
								{resident.rentalStatusLabel} • Ocupa desde {resident.occupiedSince}
							</div>
						</div>
						<div class="rounded-xl border border-border/70 bg-background/80 p-2.5">
							<div class="text-xs tracking-[0.08em] text-muted-foreground uppercase">Área e fração</div>
							<div class="mt-1 font-semibold text-foreground">{resident.privateAreaLabel}</div>
							<div class="mt-1 text-xs text-muted-foreground">
								Fração ideal {resident.idealFractionLabel}
							</div>
						</div>
						<div class="rounded-xl border border-border/70 bg-background/80 p-2.5">
							<div class="text-xs tracking-[0.08em] text-muted-foreground uppercase">Vagas de garagem</div>
							<div class="mt-1 font-semibold text-foreground">{resident.parkingSpots}</div>
							<div class="mt-1 text-xs text-muted-foreground">Competência atual {financial.competenceLabel}</div>
						</div>
						<div class="rounded-xl border border-border/70 bg-background/80 p-2.5">
							<div class="flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
								<PhoneIcon class="size-3.5" aria-hidden="true" />
								Telefone
							</div>
							<div class="mt-1 font-semibold text-foreground">{resident.phone}</div>
						</div>
						<div class="rounded-xl border border-border/70 bg-background/80 p-2.5">
							<div class="flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
								<MailIcon class="size-3.5" aria-hidden="true" />
								E-mail
							</div>
							<div class="mt-1 break-all font-semibold text-foreground">{resident.email}</div>
						</div>
						<div class="rounded-xl border border-border/70 bg-background/80 p-2.5">
							<div class="flex items-center gap-2 text-xs tracking-[0.08em] text-muted-foreground uppercase">
								<MapPinnedIcon class="size-3.5" aria-hidden="true" />
								Observação administrativa
							</div>
							<div class="mt-1 text-sm font-medium text-foreground">{financial.adminNote}</div>
						</div>
					</div>

				</div>

				<div
					id="unit-financial-report-summary-panel"
					data-test="unit-financial-report-summary-panel"
					class={cn(
						'rounded-2xl border p-3',
						financial.status === 'inadimplente'
							? 'border-rose-200 bg-rose-50/90'
							: 'border-border/70 bg-background/85'
					)}
				>
					<div class="flex flex-col gap-3">
						<div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
							<div>
								<div class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
									Saúde financeira
								</div>
								{#if financial.status === 'inadimplente'}
									<div class="mt-2">
										<div class="text-[11px] font-medium tracking-[0.08em] text-rose-700 uppercase">
											Dívida em aberto
										</div>
										<div class="mt-1 text-2xl font-semibold tracking-tight text-rose-700">
											{formatCurrency(financial.totalDebt)}
										</div>
										<div class="mt-1 text-xs text-rose-700/90 sm:text-sm">
											{financial.openMonthsCount} meses em aberto e próximo boleto de
											{` ${formatCurrency(financial.nextInvoiceAmount)}`}
										</div>
									</div>
								{:else}
									<div class="mt-2">
										<div class="text-[11px] font-medium tracking-[0.08em] text-emerald-700 uppercase">
											Situação atual
										</div>
										<div class="mt-1 text-xl font-semibold tracking-tight text-emerald-700">
											Tudo em dia
										</div>
										<div class="mt-1 text-xs text-emerald-700/90 sm:text-sm">
											Último pagamento em {financial.lastPaymentLabel}
										</div>
									</div>
								{/if}
							</div>

							<div class="flex flex-col items-start gap-3 sm:items-end">
								<div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
									{#each actions as action}
									<Button
										type="button"
										variant="outline"
										class="h-9 min-w-0 justify-start gap-2 rounded-xl border-border bg-background px-3 text-foreground hover:bg-muted"
									>
										<action.icon class="size-4 shrink-0" aria-hidden="true" />
										<span class="truncate">{action.label}</span>
									</Button>
									{/each}
								</div>
							</div>
						</div>

						<div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
							{#each summaryPanelCards as item}
								<div class="rounded-xl bg-muted/35 p-2.5">
									<div class="text-[11px] tracking-[0.08em] text-muted-foreground uppercase">
										{item.label}
									</div>
									<div class="mt-1 font-semibold text-foreground">{item.value}</div>
									<div class="mt-0.5 text-xs text-muted-foreground">{item.helper}</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
	</section>

	{#if compactKpis.length > 0}
		<section
			id="unit-financial-report-kpis"
			data-test="unit-financial-report-kpis"
			class="grid grid-cols-1 gap-3"
		>
			<div class="grid grid-cols-1 gap-3 md:grid-cols-2">
				{#each compactKpis as item}
					<Card.Root>
						<Card.Content class="p-3">
							<div
								class={cn(
									'inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase',
									getToneClasses(item.tone)
								)}
							>
								{item.label}
							</div>
							<div class="mt-2 text-lg font-semibold tracking-tight text-foreground">{item.value}</div>
							<p class="mt-0.5 text-xs text-muted-foreground sm:text-sm">{item.helper}</p>
						</Card.Content>
					</Card.Root>
				{/each}
			</div>
		</section>
	{/if}

	<section
		id="unit-financial-report-financial-tabs"
		data-test="unit-financial-report-financial-tabs"
		class="grid grid-cols-1 gap-4"
	>
		<Card.Root>
			<Card.Header>
				<Card.Title>Financeiro detalhado</Card.Title>
				<Card.Description>Alterne entre lista de faturas e balancetes com o resumo dos gastos do condomínio.</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-3">
				<div
					id="financial-period-filter"
					data-test="financial-period-filter"
					class="grid grid-cols-1 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3 md:grid-cols-[minmax(0,180px)_minmax(0,180px)_auto]"
				>
					<div class="space-y-2">
						<Label for="financial-period-start">Período inicial</Label>
						<Input
							id="financial-period-start"
							data-test="financial-period-start"
							type="month"
							value={periodStartMonth}
							oninput={(event) => {
								const target = event.currentTarget as HTMLInputElement;
								periodStartMonth = target.value;
							}}
						/>
					</div>

					<div class="space-y-2">
						<Label for="financial-period-end">Período final</Label>
						<Input
							id="financial-period-end"
							data-test="financial-period-end"
							type="month"
							value={periodEndMonth}
							oninput={(event) => {
								const target = event.currentTarget as HTMLInputElement;
								periodEndMonth = target.value;
							}}
						/>
					</div>

					<div class="flex items-end">
						<Button
							id="financial-period-clear"
							data-test="financial-period-clear"
							type="button"
							variant="outline"
							class="w-full md:w-auto"
							onclick={() => {
								periodStartMonth = '';
								periodEndMonth = '';
							}}
						>
							Limpar período
						</Button>
					</div>
				</div>

				<Tabs.Root bind:value={activeFinancialTab}>
					<Tabs.List>
						<Tabs.Trigger
							id="financial-tab-invoices"
							data-test="financial-tab-invoices"
							value="invoices"
						>
							Lista de faturas
						</Tabs.Trigger>
						<Tabs.Trigger
							id="financial-tab-annual"
							data-test="financial-tab-annual"
							value="annual"
						>
							Balancetes
						</Tabs.Trigger>
						<Tabs.Trigger
							id="financial-tab-residents"
							data-test="financial-tab-residents"
							value="residents"
						>
							Moradores
						</Tabs.Trigger>
					</Tabs.List>

					<Tabs.Content value="invoices" class="mt-3 space-y-3">
						<div class="flex flex-wrap gap-1.5">
							{#each invoiceFilters as filter}
								<button
									id={`invoice-filter-${filter.key}`}
									data-test={`invoice-filter-${filter.key}`}
									type="button"
									class={cn(
										'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm',
										selectedInvoiceFilter === filter.key
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border bg-background text-foreground hover:bg-muted'
									)}
									onclick={() => {
										selectedInvoiceFilter = filter.key;
									}}
								>
									{filter.label}
								</button>
							{/each}
						</div>

						<div class="overflow-hidden rounded-lg border">
							<Table.Root class="text-sm">
								<Table.Header class="bg-muted/35">
									<Table.Row class="hover:bg-transparent">
										<Table.Head class="w-[120px] pl-4">Referência</Table.Head>
										<Table.Head class="w-[120px]">Vencimento</Table.Head>
										<Table.Head class="w-[120px]">Valor</Table.Head>
										<Table.Head class="w-[150px]">Pagamento</Table.Head>
										<Table.Head class="w-[120px]">Status</Table.Head>
										<Table.Head class="w-[220px] pr-4 text-right">Ação</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each pagedInvoices as invoice}
										<Table.Row>
											<Table.Cell class="pl-4 font-medium text-foreground">
												{invoice.referenceLabel}
											</Table.Cell>
											<Table.Cell class="text-muted-foreground">
												{formatDate(invoice.dueDate)}
											</Table.Cell>
											<Table.Cell class="font-medium text-foreground">
												{formatCurrency(invoice.amount)}
											</Table.Cell>
											<Table.Cell class="text-muted-foreground">
												{invoice.paymentDate ? formatDate(invoice.paymentDate) : 'Aguardando compensação'}
											</Table.Cell>
											<Table.Cell>
												<span
													class={cn(
														'inline-flex rounded-full px-2.5 py-1 text-xs font-medium',
														getInvoiceStatusClasses(invoice.status)
													)}
												>
													{getInvoiceStatusLabel(invoice.status)}
												</span>
											</Table.Cell>
											<Table.Cell class="pr-4 text-right">
												<div class="flex items-center justify-end gap-2">
													<Button type="button" variant="outline" class="h-8 px-3 text-xs">
														{invoice.invoiceActionLabel}
													</Button>
													<Button type="button" variant="outline" class="h-8 px-3 text-xs">
														{invoice.balanceActionLabel}
													</Button>
												</div>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>

						<div class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
							<div class="text-sm text-muted-foreground">
								Mostrando {pagedInvoices.length} de {filteredInvoices.length} faturas.
							</div>

							<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
								<div class="flex items-center gap-2 sm:shrink-0">
									<Label class="text-sm font-medium whitespace-nowrap">Itens por página</Label>
									<div class="flex items-center overflow-hidden rounded-md border border-input">
										{#each [5, 10, 20, 30] as size}
											<button
												type="button"
												class={cn(
													'h-9 min-w-10 border-r px-3 text-sm font-medium transition-colors last:border-r-0',
													invoicesPageSize === size
														? 'bg-primary text-primary-foreground'
														: 'bg-background text-foreground hover:bg-muted'
												)}
												onclick={() => {
													invoicesPageSize = size;
												}}
											>
												{size}
											</button>
										{/each}
									</div>
								</div>

								<div class="flex flex-wrap items-center gap-2 sm:justify-end">
									<div class="text-sm font-medium whitespace-nowrap text-foreground">
										Página {invoicesCurrentPage} de {invoicesTotalPages}
									</div>
									<div class="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											class="hidden sm:flex"
											disabled={invoicesCurrentPage <= 1}
											onclick={() => {
												invoicesCurrentPage = 1;
											}}
										>
											<ChevronsLeftIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={invoicesCurrentPage <= 1}
											onclick={() => {
												invoicesCurrentPage -= 1;
											}}
										>
											<ChevronLeftIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={invoicesCurrentPage >= invoicesTotalPages}
											onclick={() => {
												invoicesCurrentPage += 1;
											}}
										>
											<ChevronRightIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											class="hidden sm:flex"
											disabled={invoicesCurrentPage >= invoicesTotalPages}
											onclick={() => {
												invoicesCurrentPage = invoicesTotalPages;
											}}
										>
											<ChevronsRightIcon class="size-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					</Tabs.Content>

					<Tabs.Content value="annual" class="mt-3 space-y-3">
						<div class="flex flex-wrap gap-1.5">
							{#each balanceFilters as filter}
								<button
									id={`balance-filter-${filter.key}`}
									data-test={`balance-filter-${filter.key}`}
									type="button"
									class={cn(
										'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm',
										selectedBalanceFilter === filter.key
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border bg-background text-foreground hover:bg-muted'
									)}
									onclick={() => {
										selectedBalanceFilter = filter.key;
									}}
								>
									{filter.label}
								</button>
							{/each}
						</div>

						<div class="overflow-hidden rounded-lg border">
							<Table.Root class="text-sm">
								<Table.Header class="bg-muted/35">
									<Table.Row class="hover:bg-transparent">
										<Table.Head class="w-[120px] pl-4">Competência</Table.Head>
										<Table.Head class="w-[140px]">Resumo do mês</Table.Head>
										<Table.Head>Status</Table.Head>
										<Table.Head class="w-[180px]">Ação</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each pagedAnnualSummary as item}
										<Table.Row>
											<Table.Cell class="pl-4 font-medium text-foreground">{item.monthLabel}</Table.Cell>
											<Table.Cell class="font-medium text-foreground">
												{formatCurrency(item.amount)}
											</Table.Cell>
											<Table.Cell>
												<FinancialStatusBadge
													status={item.statusLabel === 'Adimplente' ? 'adimplente' : 'inadimplente'}
												/>
											</Table.Cell>
											<Table.Cell>
												<Button type="button" variant="outline" class="h-8 px-3 text-xs">
													{item.balanceActionLabel}
												</Button>
											</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>

						<div class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
							<div class="text-sm text-muted-foreground">
								Mostrando {pagedAnnualSummary.length} de {filteredAnnualSummary.length} meses.
							</div>

							<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
								<div class="flex items-center gap-2 sm:shrink-0">
									<Label class="text-sm font-medium whitespace-nowrap">Itens por página</Label>
									<div class="flex items-center overflow-hidden rounded-md border border-input">
										{#each [5, 10, 20, 30] as size}
											<button
												type="button"
												class={cn(
													'h-9 min-w-10 border-r px-3 text-sm font-medium transition-colors last:border-r-0',
													annualPageSize === size
														? 'bg-primary text-primary-foreground'
														: 'bg-background text-foreground hover:bg-muted'
												)}
												onclick={() => {
													annualPageSize = size;
												}}
											>
												{size}
											</button>
										{/each}
									</div>
								</div>

								<div class="flex flex-wrap items-center gap-2 sm:justify-end">
									<div class="text-sm font-medium whitespace-nowrap text-foreground">
										Página {annualCurrentPage} de {annualTotalPages}
									</div>
									<div class="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											class="hidden sm:flex"
											disabled={annualCurrentPage <= 1}
											onclick={() => {
												annualCurrentPage = 1;
											}}
										>
											<ChevronsLeftIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={annualCurrentPage <= 1}
											onclick={() => {
												annualCurrentPage -= 1;
											}}
										>
											<ChevronLeftIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={annualCurrentPage >= annualTotalPages}
											onclick={() => {
												annualCurrentPage += 1;
											}}
										>
											<ChevronRightIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											class="hidden sm:flex"
											disabled={annualCurrentPage >= annualTotalPages}
											onclick={() => {
												annualCurrentPage = annualTotalPages;
											}}
										>
											<ChevronsRightIcon class="size-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>

						<div class="rounded-xl border border-border/70 bg-muted/30 p-3">
							<div class="text-xs tracking-[0.08em] text-muted-foreground uppercase">Total pago nos últimos 12 meses</div>
							<div class="mt-1 text-2xl font-semibold tracking-tight text-foreground">
								{formatCurrency(financial.totalPaidLast12Months)}
							</div>
						</div>
					</Tabs.Content>

					<Tabs.Content value="residents" class="mt-3 space-y-3">
						<div class="flex flex-wrap gap-1.5">
							{#each residentFilters as filter}
								<button
									id={`resident-filter-${filter.key}`}
									data-test={`resident-filter-${filter.key}`}
									type="button"
									class={cn(
										'rounded-full border px-2.5 py-1 text-xs font-medium transition-colors sm:text-sm',
										selectedResidentFilter === filter.key
											? 'border-primary bg-primary text-primary-foreground'
											: 'border-border bg-background text-foreground hover:bg-muted'
									)}
									onclick={() => {
										selectedResidentFilter = filter.key;
									}}
								>
									{filter.label}
								</button>
							{/each}
						</div>

						<div class="overflow-hidden rounded-lg border">
							<Table.Root class="text-sm">
								<Table.Header class="bg-muted/35">
									<Table.Row class="hover:bg-transparent">
										<Table.Head class="w-[220px] pl-4">Nome</Table.Head>
										<Table.Head class="w-[140px]">Vínculo</Table.Head>
										<Table.Head class="w-[160px]">Situação</Table.Head>
										<Table.Head class="w-[160px]">Telefone</Table.Head>
										<Table.Head>Email</Table.Head>
										<Table.Head class="w-[160px] pr-4">Desde</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each pagedResidents as item}
										<Table.Row>
											<Table.Cell class="pl-4 font-medium text-foreground">{item.name}</Table.Cell>
											<Table.Cell class="text-muted-foreground">{item.roleLabel}</Table.Cell>
											<Table.Cell class="text-muted-foreground">{item.occupancyLabel}</Table.Cell>
											<Table.Cell class="text-muted-foreground">{item.phone}</Table.Cell>
											<Table.Cell class="text-muted-foreground">{item.email}</Table.Cell>
											<Table.Cell class="pr-4 text-muted-foreground">{item.sinceLabel}</Table.Cell>
										</Table.Row>
									{/each}
								</Table.Body>
							</Table.Root>
						</div>

						<div class="flex flex-col gap-3 px-1 lg:flex-row lg:items-center lg:justify-between">
							<div class="text-sm text-muted-foreground">
								Mostrando {pagedResidents.length} de {filteredResidents.length} moradores.
							</div>

							<div class="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
								<div class="flex items-center gap-2 sm:shrink-0">
									<Label class="text-sm font-medium whitespace-nowrap">Itens por página</Label>
									<div class="flex items-center overflow-hidden rounded-md border border-input">
										{#each [5, 10, 20, 30] as size}
											<button
												type="button"
												class={cn(
													'h-9 min-w-10 border-r px-3 text-sm font-medium transition-colors last:border-r-0',
													residentsPageSize === size
														? 'bg-primary text-primary-foreground'
														: 'bg-background text-foreground hover:bg-muted'
												)}
												onclick={() => {
													residentsPageSize = size;
												}}
											>
												{size}
											</button>
										{/each}
									</div>
								</div>

								<div class="flex flex-wrap items-center gap-2 sm:justify-end">
									<div class="text-sm font-medium whitespace-nowrap text-foreground">
										Página {residentsCurrentPage} de {residentsTotalPages}
									</div>
									<div class="flex items-center gap-2">
										<Button
											variant="outline"
											size="icon"
											class="hidden sm:flex"
											disabled={residentsCurrentPage <= 1}
											onclick={() => {
												residentsCurrentPage = 1;
											}}
										>
											<ChevronsLeftIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={residentsCurrentPage <= 1}
											onclick={() => {
												residentsCurrentPage -= 1;
											}}
										>
											<ChevronLeftIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											disabled={residentsCurrentPage >= residentsTotalPages}
											onclick={() => {
												residentsCurrentPage += 1;
											}}
										>
											<ChevronRightIcon class="size-4" />
										</Button>
										<Button
											variant="outline"
											size="icon"
											class="hidden sm:flex"
											disabled={residentsCurrentPage >= residentsTotalPages}
											onclick={() => {
												residentsCurrentPage = residentsTotalPages;
											}}
										>
											<ChevronsRightIcon class="size-4" />
										</Button>
									</div>
								</div>
							</div>
						</div>
					</Tabs.Content>
				</Tabs.Root>
			</Card.Content>
		</Card.Root>
	</section>
</div>
