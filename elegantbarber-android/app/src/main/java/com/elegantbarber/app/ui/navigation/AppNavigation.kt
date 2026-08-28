package com.elegantbarber.app.ui.navigation

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Description
import androidx.compose.material.icons.filled.Dashboard
import androidx.compose.material.icons.filled.PointOfSale
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material.icons.outlined.CalendarMonth
import androidx.compose.material.icons.outlined.Description
import androidx.compose.material.icons.outlined.Dashboard
import androidx.compose.material.icons.outlined.PointOfSale
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.NavigationBarItemDefaults
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavDestination.Companion.hierarchy
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.elegantbarber.app.ui.screens.bookings.BookingsScreen
import com.elegantbarber.app.ui.screens.dashboard.DashboardScreen
import com.elegantbarber.app.ui.screens.kasir.KasirScreen
import com.elegantbarber.app.ui.screens.login.LoginScreen
import com.elegantbarber.app.ui.screens.reports.ReportsScreen
import com.elegantbarber.app.ui.screens.barbers.BarbersScreen
import com.elegantbarber.app.ui.screens.services.ServicesScreen
import com.elegantbarber.app.ui.screens.settings.SettingsScreen
import com.elegantbarber.app.ui.theme.BackgroundDark
import com.elegantbarber.app.ui.theme.Gold
import com.elegantbarber.app.ui.theme.SurfaceDark
import com.elegantbarber.app.viewmodel.MainViewModel

sealed class BottomNavItem(
    val route: String,
    val label: String,
    val selectedIcon: ImageVector,
    val unselectedIcon: ImageVector
) {
    data object Dashboard : BottomNavItem("dashboard", "Dashboard", Icons.Filled.Dashboard, Icons.Outlined.Dashboard)
    data object Kasir : BottomNavItem("kasir", "Kasir", Icons.Filled.PointOfSale, Icons.Outlined.PointOfSale)
    data object Bookings : BottomNavItem("bookings", "Booking", Icons.Filled.CalendarMonth, Icons.Outlined.CalendarMonth)
    data object Laporan : BottomNavItem("laporan", "Laporan", Icons.Filled.Description, Icons.Outlined.Description)
    data object Settings : BottomNavItem("settings", "Lainnya", Icons.Filled.Settings, Icons.Outlined.Settings)
}

private data object Services : BottomNavItem("services", "Servis", Icons.Filled.Description, Icons.Outlined.Description)
private data object Barbers : BottomNavItem("barbers", "Barber", Icons.Filled.Description, Icons.Outlined.Description)

private val bottomNavItems = listOf(
    BottomNavItem.Dashboard,
    BottomNavItem.Kasir,
    BottomNavItem.Bookings,
    BottomNavItem.Laporan,
    BottomNavItem.Settings
)

@Composable
fun AppNavigation(
    mainViewModel: MainViewModel = hiltViewModel()
) {
    val mainState by mainViewModel.uiState.collectAsState()
    val navController = rememberNavController()

    when {
        mainState.isCheckingAuth -> {
            // Splash / loading screen
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .background(BackgroundDark),
                horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally,
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.Center
            ) {
                Text("✂", fontSize = 56.sp, color = Gold)
                Text("Elegant Barbershop", style = MaterialTheme.typography.titleLarge, color = Color(0xFFF5F5F7))
            }
        }
        !mainState.isLoggedIn -> {
            LoginScreen(
                onLoginSuccess = mainViewModel::onLoginSuccess
            )
        }
        else -> {
            MainScaffold(
                navController = navController,
                displayName = mainState.displayName,
                onLogout = mainViewModel::logout
            )
        }
    }
}

@Composable
private fun MainScaffold(
    navController: NavHostController,
    displayName: String,
    onLogout: () -> Unit
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentDestination = navBackStackEntry?.destination

    Scaffold(
        containerColor = BackgroundDark,
        bottomBar = {
            NavigationBar(
                containerColor = SurfaceDark,
                contentColor = Color(0xFFF5F5F7)
            ) {
                bottomNavItems.forEach { item ->
                    val selected = currentDestination?.hierarchy?.any {
                        it.route == item.route
                    } == true
                    NavigationBarItem(
                        selected = selected,
                        onClick = {
                            navController.navigate(item.route) {
                                popUpTo(navController.graph.findStartDestination().id) {
                                    saveState = true
                                }
                                launchSingleTop = true
                                restoreState = true
                            }
                        },
                        icon = {
                            Icon(
                                imageVector = if (selected) item.selectedIcon else item.unselectedIcon,
                                contentDescription = item.label
                            )
                        },
                        label = { Text(item.label) },
                        colors = NavigationBarItemDefaults.colors(
                            selectedIconColor = Gold,
                            selectedTextColor = Gold,
                            unselectedIconColor = Color(0xFF9CA3AF),
                            unselectedTextColor = Color(0xFF9CA3AF),
                            indicatorColor = Gold.copy(alpha = 0.15f)
                        )
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = BottomNavItem.Dashboard.route,
            modifier = Modifier.padding(innerPadding)
        ) {
            composable(BottomNavItem.Dashboard.route) {
                DashboardScreen(
                    onNavigateKasir = {
                        navController.navigate(BottomNavItem.Kasir.route) {
                            launchSingleTop = true
                        }
                    },
                    onNavigateBookings = {
                        navController.navigate(BottomNavItem.Bookings.route) {
                            launchSingleTop = true
                        }
                    },
                    onNavigateReports = {
                        navController.navigate(BottomNavItem.Laporan.route) {
                            launchSingleTop = true
                        }
                    }
                )
            }
            composable(BottomNavItem.Kasir.route) {
                KasirScreen()
            }
            composable(BottomNavItem.Bookings.route) {
                BookingsScreen()
            }
            composable(BottomNavItem.Laporan.route) {
                ReportsScreen()
            }
            composable(BottomNavItem.Settings.route) {
                SettingsScreen(
                    displayName = displayName,
                    onLogout = onLogout,
                    onServices = { navController.navigate(Services.route) { launchSingleTop = true } },
                    onBarbers = { navController.navigate(Barbers.route) { launchSingleTop = true } }
                )
            }
            composable(Services.route) {
                ServicesScreen()
            }
            composable(Barbers.route) {
                BarbersScreen()
            }
        }
    }
}
