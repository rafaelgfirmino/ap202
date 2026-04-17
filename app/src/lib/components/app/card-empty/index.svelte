<script lang="ts">
    import * as Card from '$lib/components/ui/card/index.js';
    import * as Empty from '$lib/components/ui/empty/index.js';
    import FolderCodeIcon from '@lucide/svelte/icons/folder-code';
    import { Button } from '$lib/components/ui/button/index.js';
</script>
<Card.Root>
  <Card.Content>
    <Empty.Root>
  <Empty.Header>
    <Empty.Media variant="icon">
      <FolderCodeIcon />
    </Empty.Media>
    <Empty.Title>Nenhum bloco cadastrado</Empty.Title>
  </Empty.Header>
  <Empty.Content>
    <div class="flex flex-col gap-4 justify-center items-center">
    <div class="flex flex-col items-start text-justify-start">
  <span class="text-muted-foreground block text-sm">Parece que ainda não há blocos cadastrados para este condomínio.
    Comece criando um bloco para organizar suas unidades e lançamentos.
    você pode criar quantos blocos quiser e editá-los posteriormente desde que não tenham sido utilizados em lançamentos ou rateios.</span>
    </div>
   
      <Button>Criar Bloco</Button>
    </div>
  </Empty.Content>
</Empty.Root>
  </Card.Content>
</Card.Root>