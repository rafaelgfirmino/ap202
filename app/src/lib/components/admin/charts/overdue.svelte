<script lang="ts">
 import { Button } from "$lib/components/ui/button/index.js";
 import { Label } from "$lib/components/ui/label/index.js";
 import { Input } from "$lib/components/ui/input/index.js";
 import * as Card from "$lib/components/ui/card/index.js";
</script>
 
<Card.Root class="w-full max-w-sm">
 <Card.Header>
  <Card.Title>Login to your account</Card.Title>
  <Card.Description
   >Enter your email below to login to your account</Card.Description
  >
  <Card.Action>
   <Button variant="link">Sign Up</Button>
  </Card.Action>
 </Card.Header>
 <Card.Content>

 </Card.Content>
 <Card.Footer class="flex-col gap-2">
  <Button type="submit" class="w-full">Enviar Cobrança</Button>
 </Card.Footer>
</Card.Root>