import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { useAuth } from '../../hooks/useAuth';

export default function CalculatorScreen() {
  const { theme } = useAuth();

  const [expression, setExpression] = useState('');
  const [result, setResult] = useState('');

  // Safe Math Expression Evaluator (Never uses eval)
  const safeEvaluate = (expr) => {
    try {
      if (!expr || expr.trim() === '') return '';

      // Normalize operators: replace × with *, ÷ with /
      let sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/');

      // Tokenize into numbers and operators
      const tokens = [];
      let currentNumber = '';

      for (let i = 0; i < sanitized.length; i++) {
        const char = sanitized[i];

        if (/[0-9.]/.test(char)) {
          currentNumber += char;
        } else if (['+', '-', '*', '/', '%'].includes(char)) {
          if (currentNumber !== '') {
            tokens.push(parseFloat(currentNumber));
            currentNumber = '';
          } else if (char === '-' && (tokens.length === 0 || typeof tokens[tokens.length - 1] === 'string')) {
            // Negative number prefix
            currentNumber = '-';
            continue;
          }
          tokens.push(char);
        }
      }

      if (currentNumber !== '') {
        tokens.push(parseFloat(currentNumber));
      }

      if (tokens.length === 0) return '';

      // First pass: Percentage
      const percentageResolved = [];
      for (let i = 0; i < tokens.length; i++) {
        if (tokens[i] === '%') {
          if (percentageResolved.length > 0 && typeof percentageResolved[percentageResolved.length - 1] === 'number') {
            const prevNum = percentageResolved.pop();
            percentageResolved.push(prevNum / 100);
          }
        } else {
          percentageResolved.push(tokens[i]);
        }
      }

      // Second pass: Multiplication and Division
      const mulDivResolved = [];
      let i = 0;
      while (i < percentageResolved.length) {
        const token = percentageResolved[i];
        if (token === '*' || token === '/') {
          const prev = mulDivResolved.pop();
          const next = percentageResolved[i + 1];
          if (typeof prev !== 'number' || typeof next !== 'number') return 'Error';

          if (token === '*') {
            mulDivResolved.push(prev * next);
          } else {
            if (next === 0) return 'Cannot divide by 0';
            mulDivResolved.push(prev / next);
          }
          i += 2;
        } else {
          mulDivResolved.push(token);
          i++;
        }
      }

      // Third pass: Addition and Subtraction
      if (mulDivResolved.length === 0) return '';
      let finalVal = typeof mulDivResolved[0] === 'number' ? mulDivResolved[0] : 0;
      let j = 1;

      while (j < mulDivResolved.length) {
        const op = mulDivResolved[j];
        const next = mulDivResolved[j + 1];

        if (typeof next !== 'number') break;

        if (op === '+') {
          finalVal += next;
        } else if (op === '-') {
          finalVal -= next;
        }
        j += 2;
      }

      // Format result (trim extra decimal zeroes)
      return Number.isInteger(finalVal) ? String(finalVal) : String(parseFloat(finalVal.toFixed(6)));
    } catch (e) {
      return 'Error';
    }
  };

  const handlePress = (val) => {
    if (val === 'C') {
      setExpression('');
      setResult('');
    } else if (val === 'DEL') {
      const nextExpr = expression.slice(0, -1);
      setExpression(nextExpr);
      if (nextExpr) {
        const res = safeEvaluate(nextExpr);
        if (res !== 'Error' && res !== 'Cannot divide by 0') setResult(res);
      } else {
        setResult('');
      }
    } else if (val === '=') {
      const finalRes = safeEvaluate(expression);
      if (finalRes !== 'Error' && finalRes !== 'Cannot divide by 0') {
        setExpression(finalRes);
        setResult('');
      } else {
        setResult(finalRes);
      }
    } else {
      // Append number or operator
      const nextExpr = expression + val;
      setExpression(nextExpr);
      const live = safeEvaluate(nextExpr);
      if (live !== 'Error' && live !== 'Cannot divide by 0') {
        setResult(live);
      }
    }
  };

  const keypad = [
    ['C', 'DEL', '%', '÷'],
    ['7', '8', '9', '×'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '00', '.', '='],
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Header title="Student Calculator" />

      {/* Screen Display */}
      <View style={[styles.displayContainer, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <Text style={[styles.expressionText, { color: theme.textMuted }]} numberOfLines={2}>
          {expression || '0'}
        </Text>
        <Text style={[styles.resultText, { color: theme.text }]} numberOfLines={1}>
          {result ? `= ${result}` : expression ? '' : '0'}
        </Text>
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        {keypad.map((row, rowIdx) => (
          <View key={`row-${rowIdx}`} style={styles.buttonRow}>
            {row.map((btn) => {
              const isOperator = ['÷', '×', '-', '+', '='].includes(btn);
              const isAction = ['C', 'DEL', '%'].includes(btn);
              const isEqual = btn === '=';

              return (
                <TouchableOpacity
                  key={btn}
                  style={[
                    styles.calcButton,
                    {
                      backgroundColor: isEqual
                        ? theme.primary
                        : isOperator
                        ? `${theme.primary}25`
                        : isAction
                        ? theme.inputBackground
                        : theme.card,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => handlePress(btn)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.buttonText,
                      {
                        color: isEqual
                          ? '#FFFFFF'
                          : isOperator
                          ? theme.primary
                          : isAction
                          ? theme.danger
                          : theme.text,
                        fontWeight: isOperator || isEqual ? '800' : '600',
                      },
                    ]}
                  >
                    {btn}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  displayContainer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    minHeight: 110,
    maxHeight: 160,
    borderBottomWidth: 1,
  },
  expressionText: {
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'right',
    marginBottom: 4,
  },
  resultText: {
    fontSize: 38,
    fontWeight: '900',
    textAlign: 'right',
    fontVariant: ['tabular-nums'],
  },
  keypadContainer: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-evenly',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
    flex: 1,
  },
  calcButton: {
    flex: 1,
    maxHeight: 64,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  buttonText: {
    fontSize: 20,
  },
});
