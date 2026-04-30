# NightShift

> 馃寵 Your 24/7 AI Dev Team. Code While You Sleep.

馃毀 **Under Active Development** - MVP in progress

## 鉁?鏍稿績鐗规€?
- 馃 澶欰gent骞跺彂锛氬墠绔?鍚庣/娴嬭瘯鍚屾椂寮€宸ワ紝姣斿崟Agent蹇?-5鍊?
- 馃搵 鏅鸿兘浠诲姟璁″垝锛氳嚜鐒惰瑷€ 鈫?鑷姩鎷嗚В 鈫?TODO list 鈫?瀹炴椂杩借釜
- 馃攣 RuleForge闆嗘垚锛氳嚜鍔ㄦ矇娣€缂栫爜瑙勮寖锛岃秺鐢ㄨ秺鎳備綘
- 馃挵 鎴愭湰鍙帶锛氭湰鍦版ā鍨嬩紭鍏?+ 璇箟缂撳瓨 + 鏅鸿兘璺敱
- 馃敁 瀹屽叏寮€婧愶細MIT License锛屾暟鎹湰鍦颁紭鍏?

## 馃殌 蹇€熷紑濮嬶紙寮€鍙戜腑锛?
```bash
# 1. 瀹夎渚濊禆
npm install

# 2. 閾炬帴 RuleForge锛堢‘淇?../ruleforge 瀛樺湪锛?
cd ../ruleforge/packages/core && npm link
cd ../../NightShift && npm link @ruleforge/core

# 3. 鏋勫缓
npm run build

# 4. 杩愯婕旂ず
npm run start:demo
```

## 馃搧 椤圭洰缁撴瀯
```
NightShift/
鈹溾攢鈹€ packages/
鈹?  鈹溾攢鈹€ core/          # 鏍稿績璋冨害寮曟搸
鈹?  鈹溾攢鈹€ agents/        # Agent 瑙掕壊瀹炵幇
鈹?  鈹溾攢鈹€ editor/        # Trae/VSCode 鎻掍欢
鈹?  鈹斺攢鈹€ ruleforge-bridge/  # RuleForge 妗ユ帴灞?
鈹溾攢鈹€ config/            # 閰嶇疆鏂囦欢妯℃澘
鈹斺攢鈹€ .nightshift/       # 杩愯鏃舵暟鎹?
```

## 馃摐 License
MIT
