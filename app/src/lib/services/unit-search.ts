import { listUnits, type Unit } from '$lib/services/units.js';

export type UnitSearchItem = {
	id: number;
	condominiumCode: string;
	apartmentNumber: string;
	block: string;
	floor: string;
	residentName: string;
	status: 'adimplente' | 'inadimplente';
	totalOpenAmountLabel: string;
	href: string;
};

function getGroupTypeLabel(groupType: string | undefined): string {
	const labels: Record<string, string> = {
		block: 'Bloco',
		tower: 'Torre',
		sector: 'Setor',
		court: 'Quadra',
		phase: 'Fase'
	};

	if (!groupType) {
		return 'Grupo';
	}

	return labels[groupType] ?? groupType;
}

function formatBlock(unit: Pick<Unit, 'group_type' | 'group_name'>): string {
	if (!unit.group_name) {
		return 'Sem grupo';
	}

	return `${getGroupTypeLabel(unit.group_type)} ${unit.group_name}`.trim();
}

function formatFloor(value: string | undefined): string {
	const normalizedValue = value?.trim();

	if (!normalizedValue) {
		return 'Sem andar';
	}

	return `${normalizedValue}º andar`;
}

function getMockFinancialState(unitId: number): Pick<UnitSearchItem, 'status' | 'totalOpenAmountLabel'> {
	const isOverdue = unitId % 3 === 0 || unitId % 5 === 0;

	if (!isOverdue) {
		return {
			status: 'adimplente',
			totalOpenAmountLabel: 'Sem pendências'
		};
	}

	const totalOpenAmount = 180 + (unitId % 7) * 95;

	return {
		status: 'inadimplente',
		totalOpenAmountLabel: totalOpenAmount.toLocaleString('pt-BR', {
			style: 'currency',
			currency: 'BRL',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		})
	};
}

function mapUnitToSearchItem(condominiumCode: string, unit: Unit): UnitSearchItem {
	const financialState = getMockFinancialState(unit.id);

	return {
		id: unit.id,
		condominiumCode,
		apartmentNumber: unit.identifier,
		block: formatBlock(unit),
		floor: formatFloor(unit.floor),
		residentName: unit.description?.trim() || 'Morador não informado',
		status: financialState.status,
		totalOpenAmountLabel: financialState.totalOpenAmountLabel,
		href: `/g/${condominiumCode}/unidades/${unit.id}`
	};
}

/**
 * Retorna a lista de unidades disponível para a busca global do contexto `g/[code]`.
 * A fonte de dados é a listagem real de unidades, para que a navegação leve direto
 * ao detalhamento da unidade selecionada.
 */
export async function getUnitsByCondominiumCode(
	condominiumCode: string
): Promise<UnitSearchItem[]> {
	const response = await listUnits(condominiumCode);
	return response.data.map((unit) => mapUnitToSearchItem(condominiumCode, unit));
}
