<!-- src/lib/components/app-header.svelte -->
<script lang="ts">
	import { Separator } from '$lib/components/ui/separator/index.js';
	import Logo from '$lib/components/app/logo/index.svelte';
	import NavHeader from '$lib/components/app/nav-header/index.svelte';
	import UserArea from '$lib/components/app/user-area/index.svelte';
	import { Button } from '$lib/components/ui/button/index.js';
  import Building2Icon from '@lucide/svelte/icons/building-2';
  import UserPlusIcon from '@lucide/svelte/icons/user-plus';
  import SelectCondominium from '$lib/components/app/select-condominium/index.svelte';
  import ArchiveHistoryIcon from '@lucide/svelte/icons/archive-restore';
	import ArchiveRestore from '@lucide/svelte/icons/archive-restore';
  import BookOpenTextIcon from '@lucide/svelte/icons/book-open-text';
  import ChartNoAxesCombinedIcon from '@lucide/svelte/icons/chart-no-axes-combined';
  import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import * as Empty from "$lib/components/ui/empty/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import BlockMap from '$lib/components/app/blocs/index.svelte';
  import CardInsights from '$lib/components/app/card-insight/index.svelte';
</script>

<header class="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
	<div class="border-b">
		<div class="flex h-14 items-center gap-2 px-4">
			<!-- Logo -->
			<a href="/" class="mr-2 flex items-center gap-2">
				<div class="flex size-20 items-center justify-center rounded-md">
					<Logo />
				</div>
			</a>
			<NavHeader />
			<!-- User area -->
			<div class="ml-auto flex items-center gap-1">
      <SelectCondominium />
       <Separator orientation="vertical" class="mx-2 h-6" />
				<UserArea />
			</div>
		</div>
	</div>
	<div class="flex size-10 w-full items-center py-2 px-1">
		<span class="text-sm px-2 text-muted-foreground">Atalhos</span>
    
		<div class="px-10 flex">
     <Button variant="outline"  aria-label="Submit" class="m-0">
				<ChartNoAxesCombinedIcon /> Dashboard
			</Button>
    <Button variant="outline"  aria-label="Submit" class="m-0">
				<Building2Icon /> Balancete
			</Button>
			<Button variant="outline" aria-label="Submit">
				<UserPlusIcon /> Usuários
			</Button>
      <Button variant="outline" aria-label="Submit">
        <ArchiveRestore /> Arquivos
      </Button>
       <Button variant="outline" aria-label="Submit">
        <BookOpenTextIcon /> Ata
      </Button>
      <Button variant="outline" aria-label="Submit">
        <ArchiveHistoryIcon /> Histórico
      </Button>
		</div>
		<div class="ml-auto flex items-center gap-1"></div>
	</div>
</header>
<main class="mx-auto w-full">
<div class="bg-white p-2">

<CardInsights
  id="insight-overdue"
  title="10 Inadimplentes"
  description="R$ 5.000,00"
  tone="danger"
/>
<CardInsights
  id="insight-overdue"
  title="0 Aguardando pagamento"
  description="R$ 5.000,00"
  tone="neutral"
/>
<CardInsights
  id="insight-overdue"
  title="20 Adimplentes"
  description="R$ 5.000,00"
  tone="success"
/>
<CardInsights
  id="insight-overdue"
  title="Total a receber"
  description="15.000,00"
  tone="info"
/>
<CardInsights
  id="insight-overdue"
  title="Total em caixa"
  description="15.000,00"
  tone="highlight"
/>
  
</div>
<div class="mt-10 p-10">
<BlockMap
  blockName="Bloco A"
  totalFloors={3}
  columns={2}
  units={[
    {
      id: 'unit-101',
      apartmentNumber: '101',
      residentName: 'Nei Caetano',
      status: 'adimplente',
      floors: [1, 2],
      totalOpenAmount: 'R$ 0,00',
      lateInstallments: 0,
      contactPhone: '(11) 94444-1000'
    },
     {
      id: 'unit-102',
      apartmentNumber: '102',
      residentName: 'Ana Silva',
      status: 'vencido',
      floors: [1],
      totalOpenAmount: 'R$ 420,00',
      lateInstallments: 1,
      contactPhone: '(11) 95555-2222'
    },
    {
      id: 'unit-202',
      apartmentNumber: '202',
      residentName: 'Rafael Firmino',
      status: 'adimplente',
      floors: [2],
      totalOpenAmount: 'R$ 0,00',
      lateInstallments: 0,
      contactPhone: '(11) 96666-3333'
    },
      {
        id: 'unit-301',
        apartmentNumber: '301',
        residentName: 'Suellen Pissarra',
        status: 'vencido',
        floors: [3],
        totalOpenAmount: 'R$ 1.260,00',
        lateInstallments: 3,
        contactPhone: '(11) 97777-4444'
      },
        {
          id: 'unit-302',
          apartmentNumber: '302',
          residentName: 'Carlos Eduardo',
          status: 'adimplente',
          floors: [3],
          totalOpenAmount: 'R$ 0,00',
          lateInstallments: 0,
          contactPhone: '(11) 98888-5555'
        }
  ]}
/>
</div>

</main>
