import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'func',
    targets: ['./imports/stdlib.fc', './imports/op-codes.fc', './imports/jetton-params.fc', './jetton-wallet.fc'],
};
