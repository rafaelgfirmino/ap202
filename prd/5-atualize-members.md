<prompt>
  <title>Members — MVP</title>
  <project>ap202</project>
  <description>
    Alterar a url para aceitar o código da unidade ao invés do ID (unidcode) deve ser group_name + identifier na url já tem condo_code
  </description>
  <routes>
    POST   /api/v1/condominiums/{condo_code}/units/{unit_code}/members
    GET    /api/v1/condominiums/{condo_code}/units/{unit_code}/members
    DELETE /api/v1/condominiums/{condo_code}/units/{unit_code}/members/{bond_id}
  </routes>

  <unit_code_parsing>
    "A-101"  → group_name="A",  identifier="101"
    "101"    → group_name="",   identifier="101"
    "T1-202" → group_name="T1", identifier="202"
  </unit_code_parsing>

</prompt>