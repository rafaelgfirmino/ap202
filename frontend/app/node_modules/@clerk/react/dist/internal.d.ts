import { RoutingOptions, InternalClerkScriptProps } from '@clerk/shared/types';
export { InternalClerkScriptProps } from '@clerk/shared/types';
import { Ui } from '@clerk/ui/internal';
export { Ui } from '@clerk/ui/internal';
import React from 'react';
import { ClerkProviderProps } from './types.js';
import { ErrorThrowerOptions } from '@clerk/shared/error';
export { M as MultisessionAppSupport, u as useDerivedAuth } from './useAuth-DcwU7ADV.js';
export { buildClerkJSScriptAttributes, buildClerkJsScriptAttributes, buildClerkUIScriptAttributes, clerkJSScriptUrl, clerkJsScriptUrl, clerkUIScriptUrl, setClerkJSLoadingErrorPackageName, setClerkJsLoadingErrorPackageName } from '@clerk/shared/loadClerkJsScript';
import '@clerk/shared/ui';

/**
 * Overrides options of the internal errorThrower (eg setting packageName prefix).
 *
 * @internal
 */
declare function setErrorThrowerOptions(options: ErrorThrowerOptions): void;

declare function useRoutingProps<T extends RoutingOptions>(componentName: string, props: T, routingOptions?: RoutingOptions): T;

/**
 * Whether the host React version is compatible with the shared @clerk/ui variant.
 * This is computed once at module load time for optimal performance.
 */
declare const IS_REACT_SHARED_VARIANT_COMPATIBLE: boolean;

/**
 * A wider-typed version of ClerkProvider that accepts internal script props.
 * Framework SDKs should use this instead of the public ClerkProvider.
 */
declare const InternalClerkProvider: (<TUi extends Ui = Ui>(props: ClerkProviderProps<TUi> & InternalClerkScriptProps) => React.JSX.Element) & {
    displayName: string;
};

export { IS_REACT_SHARED_VARIANT_COMPATIBLE, InternalClerkProvider, setErrorThrowerOptions, useRoutingProps };
