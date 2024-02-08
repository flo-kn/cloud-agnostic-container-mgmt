/**
 * This method trims the string of a subdomain if the number of characters exceeds a maximum.
 *
 * Example:
 * Our Top Level Domain "sandbox.async.api.HelloWorldgroup.io" has 30 chars. (also need to include the leading ".")
 * ACMCertificateManager only allows an overall of 64 characters
 * So we need to trim off these from the overall amount to get the max. number of characters for the subdomain (64-30-1)

 *
 * @param subdomain - subdomain as part of the fqdn, e.g. <subdomain>.sandbox.api.HelloWorldgroup.io
 * @param secondAndTopLevelDomain - top level HelloWorld domain as part of the fqdn, e.g. sample.<domain>
 *
 * @returns the trimmed subdomain of type string
 */
export function trimHostname(subdomain: string, secondAndTopLevelDomain: string): string {
  const charLimitUrl: number = 64;
  const remainingSubdomainNameLength: number = charLimitUrl - secondAndTopLevelDomain.length - 1;
  if (subdomain.length > remainingSubdomainNameLength) {
    console.log(
      `Hostnames for "${subdomain}" exceeds the allowed max chars for AWSCertificateManager. It will get trimmed to 64 characters automatically`
    );
  }

  return subdomain.substring(0, remainingSubdomainNameLength).replace(/-$/, '');
}
