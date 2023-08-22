
export interface StellarConfig {
    
    horizon: string,
    horizon_public:string;
    is_testnet:string; 
    sep_10_signing_key:string;
    sep_10_signing_key_private:string;
    sep_10_signing_alg:string;
    sep_10_issuer:string;
    sep_10_audience:string;
    sep_10_web_auth_domain:string
}

export interface ExternalAuthConfig {
     
    signing_key:string;
    signing_key_private:string;
    signing_alg:string;
    issuer:string;
    audience:string;
}

export enum AvailableAuthMethods {
    
    stellar_address="stellar_address",
    phone_number="phone_number",
    email="email"
}

export interface FireblocksConfig {
    api_signer_key:string,
    api_secret: string,
    xlm_asset_id:string
}

export enum TransactionStatus {
    
    PENDING_SIGNATURE = "PENDING_SIGNATURE",
    SIGNING_COMPLETED = "COMPLETED",
    
}

export interface ClientAppConfig{

    url:string;

}




