/* tslint:disable:naming-convention */

import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
} from "class-validator";
import { Memo, MemoReturn, MemoHash, MemoNone,StrKey,MemoID, MemoText,xdr} from 'stellar-sdk';
import { UnsignedHyper} from 'js-xdr';

import * as libphonenumber from 'google-libphonenumber';

const isTestnet = process.env.IS_TESTNET;
const horizon = process.env.HORIZON_URL;

export function IsStellarAccount(
    property: string,
    validationOptions?: ValidationOptions
): PropertyDecorator {
    return (object, propertyName: string) => {
        registerDecorator({
            propertyName,
            name: "isStellarAccount",
            target: object.constructor,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(account: string, _args: ValidationArguments) {
                    return StrKey.isValidEd25519PublicKey(account);
                },
            },
        });
    };
}

export function IsStellarMemo(
    property: string,
    validationOptions?: ValidationOptions
): PropertyDecorator {
    return (object, propertyName: string) => {
        registerDecorator({
            propertyName,
            name: "isStellarMemo",
            target: object.constructor,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(memo: string, args: ValidationArguments) {
                    
                    const memoType = (args.object as any).memo_type;
                    
                    try {
                        
                        if (memoType === MemoNone) {
                            return false; // value cannot be provided if memoType =none
                        }

                        if (memoType === MemoHash || memoType === MemoReturn) {
                            
                            const result = new Memo(memoType, Buffer.from(memo, 'base64').toString('hex'));
                        } 

                        if (memoType === MemoID){

                            if (!memo.match(/^[0-9]*$/g) || memo.length < 0){
                                return false
                            }
                            if ( memo !== UnsignedHyper.fromString(memo).toString()){
                                return false
                            }
                        }

                        if (memoType === MemoText){
                            
                            let memoTextBytes = Buffer.byteLength(memo, "utf8");
                            
                            if (memoTextBytes > 28) {
                                return false;
                            }
                        }
                        
                        return true;
                    
                    } catch (err) {
                        return false;
                    }
                },
            },
        });
    };
}

export function IsMobilePhone(
    property: string,
    validationOptions?: ValidationOptions
): PropertyDecorator {
    return (object, propertyName: string) => {
        registerDecorator({
            propertyName,
            name: "mobile_phone",
            target: object.constructor,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(mobile_phone: string, args: ValidationArguments) {
                    try {
                       
                        const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
                        const number = phoneUtil.parseAndKeepRawInput(mobile_phone);

                        if (phoneUtil.isValidNumber(number)){
                            return true
                         }
                        
                        return false;
                    } catch (err) {
                        return false;
                    }
                },
            },
        });
    };
}

export function IsSep10Memo(
    property: string,
    validationOptions?: ValidationOptions
): PropertyDecorator {
    return (object, propertyName: string) => {
        registerDecorator({
            propertyName,
            name: "isSep10Memo",
            target: object.constructor,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(memo: string, _args: ValidationArguments) {
                    
                    if (!memo.match(/^[0-9]*$/g) || memo.length < 0){
                        return false
                    }
                    if ( memo !== UnsignedHyper.fromString(memo).toString()){
                        return false
                    }
                    return true
                },
            },
        });
    };
}

export function IsStellarXDR(
    property: string,
    validationOptions?: ValidationOptions
): PropertyDecorator {
    return (object, propertyName: string) => {
        registerDecorator({
            propertyName,
            name: "IsStellarXDR",
            target: object.constructor,
            constraints: [property],
            options: validationOptions,
            validator: {
                validate(txEnvelope: string, _args: ValidationArguments) {
                    return xdr.TransactionEnvelope.validateXDR(txEnvelope,'base64');;
                },
            },
        });
    };
}
