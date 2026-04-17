<script lang="ts">
  import TrendingUpIcon from "@lucide/svelte/icons/trending-up";
  import * as Chart from "$lib/components/ui/chart/index.js";
  import * as Card from "$lib/components/ui/card/index.js";
  import { PieChart, Text } from "layerchart";

  const chartData = [{ month: "january", desktop: 1260, mobile: 570 }];

  const chartConfig = {
    desktop: { label: "Desktop", color: "var(--chart-1)" },
    mobile: { label: "Mobile", color: "var(--chart-2)" },
  } satisfies Chart.ChartConfig;
</script>

<Card.Root class="flex flex-col">
  <Card.Header class="items-center">
    <Card.Title>Expectativa vs Recebimento</Card.Title>
    <Card.Description>Ultimo Balancete</Card.Description>
  </Card.Header>
  <Card.Content class="flex-1">
    <Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px]">
      <PieChart
        data={[
          { platform: "Recebido", visitors: 570, color: chartConfig.mobile.color },
          { platform: "Aguardando Pagamento ", visitors: 1260, color: chartConfig.desktop.color },
        ]}
        key="platform"
        value="visitors"
        c="color"
        innerRadius={76}
        padding={29}
        range={[-90, 90]}
        props={{ pie: { sort: null } }}
        cornerRadius={4}
      >
        {#snippet aboveMarks()}
          <Text
            value={String(chartData[0].desktop + chartData[0].mobile)}
            textAnchor="middle"
            verticalAnchor="middle"
            class="fill-foreground text-2xl! font-bold"
            dy={-24}
          />
          <Text
            value="Recebimento"
            textAnchor="middle"
            verticalAnchor="middle"
            class="fill-muted-foreground! text-muted-foreground"
            dy={-4}
          />
        {/snippet}
        {#snippet tooltip()}
          <Chart.Tooltip hideLabel />
        {/snippet}
      </PieChart>
    </Chart.Container>
  </Card.Content>
</Card.Root>
