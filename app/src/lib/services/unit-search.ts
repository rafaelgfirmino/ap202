export type UnitSearchItem = {
	id: string;
	condominiumCode: string;
	apartmentNumber: string;
	block: string;
	floor: string;
	residentName: string;
	status: 'adimplente' | 'inadimplente';
	totalOpenAmountLabel: string;
	href: string;
};

const allUnits: UnitSearchItem[] = [
	{
		id: 'unit-a-101',
		condominiumCode: 'default',
		apartmentNumber: '101',
		block: 'Bloco A',
		floor: '1º andar',
		residentName: 'Mariana Costa',
		status: 'adimplente',
		totalOpenAmountLabel: 'Sem pendências',
		href: '/g/default?unit=unit-a-101'
	},
	{
		id: 'unit-a-202',
		condominiumCode: 'default',
		apartmentNumber: '202',
		block: 'Bloco A',
		floor: '2º andar',
		residentName: 'Carlos Henrique',
		status: 'inadimplente',
		totalOpenAmountLabel: 'R$ 1.280 em aberto',
		href: '/g/default?unit=unit-a-202'
	},
	{
		id: 'unit-b-304',
		condominiumCode: 'default',
		apartmentNumber: '304',
		block: 'Bloco B',
		floor: '3º andar',
		residentName: 'Fernanda Lima',
		status: 'adimplente',
		totalOpenAmountLabel: 'Sem pendências',
		href: '/g/default?unit=unit-b-304'
	},
	{
		id: 'unit-b-408',
		condominiumCode: 'default',
		apartmentNumber: '408',
		block: 'Bloco B',
		floor: '4º andar',
		residentName: 'Roberto Almeida',
		status: 'inadimplente',
		totalOpenAmountLabel: 'R$ 2.430 em aberto',
		href: '/g/default?unit=unit-b-408'
	},
	{
		id: 'unit-c-512',
		condominiumCode: 'default',
		apartmentNumber: '512',
		block: 'Bloco C',
		floor: '5º andar',
		residentName: 'Juliana Rocha',
		status: 'adimplente',
		totalOpenAmountLabel: 'Sem pendências',
		href: '/g/default?unit=unit-c-512'
	}
];

/**
 * Retorna a lista de unidades disponível para a busca global do contexto `g/[code]`.
 * Enquanto a API real não estiver integrada, o service expõe dados locais já normalizados
 * para a command palette, mantendo a abstração fora dos componentes.
 */
export function getUnitsByCondominiumCode(condominiumCode: string): UnitSearchItem[] {
	return allUnits
		.filter((unit) => unit.condominiumCode === condominiumCode || unit.condominiumCode === 'default')
		.map((unit) => ({
			...unit,
			href: `/g/${condominiumCode}?unit=${unit.id}`
		}));
}
