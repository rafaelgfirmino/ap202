package domain

import "errors"

var (
	ErrPermissionNotFound          = errors.New("permission not found")
	ErrPermissionAlreadyExists     = errors.New("permission already exists")
	ErrPermissionMicroserviceEmpty = errors.New("microservice is required")
	ErrPermissionResourceEmpty     = errors.New("resource is required")
	ErrPermissionActionEmpty       = errors.New("action is required")
	ErrRoleNotFound                = errors.New("role not found")
	ErrRoleNameRequired            = errors.New("role name is required")
	ErrRoleTemplateRequired        = errors.New("permissions can only be linked to global roles or templates")
	ErrRoleInstanceAssignmentOnly  = errors.New("user must receive a tenant role instance or a global role")
	ErrRoleTemplateNotAssignable   = errors.New("template roles cannot be assigned directly to users")
	ErrUserRoleNotFound            = errors.New("user role not found")
	ErrInvalidTenantAssignment     = errors.New("role cannot be assigned to a different tenant")
	ErrTenantIDRequired            = errors.New("tenant_id is required")
	ErrTenantSetupAlreadyDone      = errors.New("tenant setup already completed")
)
