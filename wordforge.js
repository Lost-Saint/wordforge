// ==UserScript==
// @name         Wordforge
// @namespace    http://tampermonkey.net/
// @version      1.3
// @description  Replaces text with customizable case sensitivity per rule
// @author       Your name
// @match        https://etherreads.com/*
// @match        https://www.webnovel.com/*
// @match        https://booktoki466.com/*
// @match        https://www.fanmtl.com/*
// @grant        none
// ==/UserScript==

(() => {
    'use strict';

    class TextReplacer {
        constructor(rules = []) {
            this.rules = rules.filter(rule => rule.enable).map(({ oldWord, newWord, caseSensitive }) => ({
                regex: new RegExp(this.escapeRegExp(oldWord), caseSensitive ? 'g' : 'gi'),
                newWord
            }));
        }

        escapeRegExp(string) {
            return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        }

        replaceText(text) {
            return this.rules.reduce((result, { regex, newWord }) => result.replace(regex, newWord), text);
        }

        processNode(node) {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                const replacedText = this.replaceText(node.textContent);
                if (node.textContent !== replacedText) node.textContent = replacedText;
            } else if (
                node.nodeType === Node.ELEMENT_NODE &&
                !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.tagName)
            ) {
                const childNodes = node.childNodes;
                for (let i = 0, len = childNodes.length; i < len; i++) {
                    this.processNode(childNodes[i]);
                }
            }
        }

        observeMutations() {
            const observer = new MutationObserver(mutations => {
                for (let i = 0, len = mutations.length; i < len; i++) {
                    const addedNodes = mutations[i].addedNodes;
                    for (let j = 0, nodeLen = addedNodes.length; j < nodeLen; j++) {
                        this.processNode(addedNodes[j]);
                    }
                }
            });
            observer.observe(document.body, { childList: true, subtree: true });
        }

        init() {
            try {
                this.processNode(document.body);
                this.observeMutations();
            } catch (error) {
                console.error('TextReplacer initialization failed:', error);
            }
        }
    }

    const rules = [
        { oldWord: 'Rosvitha', newWord: 'Rossweisse', caseSensitive: false, enable: true },
        { oldWord: 'oldWord2', newWord: 'newWord2', caseSensitive: true, enable: false }
    ];

    const initialize = () => new TextReplacer(rules).init();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
