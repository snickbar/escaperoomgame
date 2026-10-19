package com.snickbar.escaperoom;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.widget.FrameLayout;
import androidx.webkit.WebViewAssetLoader;
import androidx.webkit.WebViewClientCompat;
import java.io.ByteArrayInputStream;

/** Offline game container. All game code and artwork ship inside this APK. */
public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/game/index.html";
    private WebView game;

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.rgb(20, 22, 28));
        root.setOnApplyWindowInsetsListener((view, insets) -> {
            if (Build.VERSION.SDK_INT >= 30) {
                android.graphics.Insets bars = insets.getInsets(
                    android.view.WindowInsets.Type.systemBars() |
                    android.view.WindowInsets.Type.displayCutout());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                view.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets.consumeSystemWindowInsets();
        });
        game = new WebView(this);
        game.setBackgroundColor(Color.rgb(20, 22, 28));
        root.addView(game, new FrameLayout.LayoutParams(-1, -1));
        setContentView(root);
        if (Build.VERSION.SDK_INT >= 33) {
            getOnBackInvokedDispatcher().registerOnBackInvokedCallback(
                android.window.OnBackInvokedDispatcher.PRIORITY_DEFAULT, this::onBackPressed);
        }
        WebView.setWebContentsDebuggingEnabled(BuildConfig.DEBUG);
        WebSettings settings = game.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSupportMultipleWindows(false);
        game.setWebChromeClient(new WebChromeClient());
        WebViewAssetLoader assets = new WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this)).build();
        game.setWebViewClient(new WebViewClientCompat() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                WebResourceResponse response = assets.shouldInterceptRequest(request.getUrl());
                if (response != null) return response;
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not found",
                    java.util.Collections.emptyMap(), new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri url = request.getUrl();
                if ("https".equals(url.getScheme()) && HOST.equals(url.getHost()) &&
                    url.getPath() != null && url.getPath().startsWith("/assets/game/")) return false;
                if (request.isForMainFrame() && ("https".equals(url.getScheme()) || "http".equals(url.getScheme()))) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, url)); }
                    catch (android.content.ActivityNotFoundException ignored) { }
                }
                return true;
            }
        });
        game.loadUrl(HOME);
    }

    @Override public void onBackPressed() {
        if (game.getUrl() != null && game.getUrl().contains("/gallery.html")) {
            if (game.canGoBack()) game.goBack(); else game.loadUrl(HOME);
            return;
        }
        game.evaluateJavascript("(() => {" +
            "if(typeof closeZoom==='function' && document.getElementById('zoomOverlay')?.classList.contains('open')) {closeZoom(); return 'closed';}" +
            "const mini=document.getElementById('miniGamesScreen');" +
            "if(mini && !mini.hidden) {goHome(); return 'closed';}" +
            "const board=document.getElementById('gameScreen');" +
            "return board && !board.hidden ? 'playing' : 'home';})()", result -> {
                if ("\"closed\"".equals(result)) return;
                if ("\"playing\"".equals(result)) {
                    new AlertDialog.Builder(this).setTitle("Return to home?")
                        .setMessage("Your current game will end. Completed decks and records will stay saved.")
                        .setNegativeButton("Keep playing", null)
                        .setPositiveButton("Home", (dialog, which) -> game.evaluateJavascript("goHome()", null)).show();
                } else {
                    new AlertDialog.Builder(this).setTitle("Close Escape Room?")
                        .setNegativeButton("Keep playing", null)
                        .setPositiveButton("Close", (dialog, which) -> finish()).show();
                }
            });
    }
    @Override protected void onPause() { game.onPause(); super.onPause(); }
    @Override protected void onResume() { super.onResume(); if (game != null) game.onResume(); }
    @Override protected void onDestroy() {
        game.stopLoading(); game.destroy(); super.onDestroy();
    }
}
