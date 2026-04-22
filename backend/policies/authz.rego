package authz

import rego.v1

default allow := {
	"allow": false,
	"reason": "permission denied",
}

allow := {
	"allow": true,
	"reason": "",
} if {
	permission := data.permissions[input.permission]
	some assignment in object.get(data.user_roles, sprintf("%d", [input.user_id]), [])
	role := data.roles[assignment.role_id]
	role_has_permission(role, input.permission)
	tenant_matches(role, assignment, input.tenant_id)
	abac_matches(permission.conditions, input)
}

role_has_permission(role, permission) if {
	permission in role.permissions
}

tenant_matches(role, assignment, tenant_id) if {
	assignment.tenant_id == tenant_id
	role.tenant_id == null
}

tenant_matches(role, assignment, tenant_id) if {
	assignment.tenant_id == tenant_id
	role.tenant_id == tenant_id
}

abac_matches(conditions, request) if {
	count(object.keys(conditions)) == 0
}

abac_matches(conditions, request) if {
	every resource_field, source_field in conditions {
		object.get(request.resource, resource_field, null) == condition_value(source_field, request)
	}
}

condition_value(source_field, request) := request.user_id if {
	source_field == "user_id"
}

condition_value(source_field, request) := object.get(request.attributes, source_field, null) if {
	source_field != "user_id"
}
